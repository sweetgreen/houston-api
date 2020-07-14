import { queryFragment } from "./fragments";
import {
  sortVariables,
  mergeEnvVariables
} from "deployments/environment-variables";
import validateEnvironment from "deployments/environment-variables/validate";
import {
  generateEnvironmentSecretName,
  generateNamespace
} from "deployments/naming";
import { track } from "analytics";
import {
  arrayOfKeyValueToObject,
  objectToArrayOfKeyValue,
  generateHelmValues,
  mapCustomEnvironmentVariables
} from "deployments/config";
import { get, filter, map } from "lodash";
import { DEPLOYMENT_AIRFLOW } from "constants";
import crypto from "crypto";

/*
 * Update a deployment's environment variables
 * @param {Object} _ The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return [EnvironmentVariable] The environmentVariables.
 */
export default async function updateDeploymentVariables(_, args, ctx) {
  const { deploymentUuid, releaseName, environmentVariables } = args;

  validateEnvironment(environmentVariables);

  const namespace = generateNamespace(releaseName);
  const name = generateEnvironmentSecretName(releaseName);

  // Get Deployment Variables
  const commanderValues = await ctx.commander.request("getSecret", {
    namespace,
    name
  });

  // Get current env variables from commander response
  const currentVariables = objectToArrayOfKeyValue(
    get(commanderValues, "secret.data", {})
  );

  // Build payload array for commander
  const newVariables = environmentVariables.map(v => ({
    key: v.key,
    value: v.value,
    isSecret: v.isSecret
  }));

  // Merge current env variables and new variables
  const updatedVariables = mergeEnvVariables(currentVariables, newVariables);

  // Create array of secret keys as k8s annotations
  const annotations = map(
    filter(updatedVariables, { isSecret: true }),
    i => i.key
  );

  // Send variable values to commander
  await ctx.commander.request("setSecret", {
    release_name: releaseName,
    namespace,
    secret: {
      name,
      data: arrayOfKeyValueToObject(updatedVariables),
      annotations: { "astronomer.io/hide-from-ui": JSON.stringify(annotations) }
    }
  });

  // Get the deployment first.
  const deployment = await ctx.db.query.deployment(
    { where: { id: deploymentUuid } },
    queryFragment
  );

  // Map the user input env vars to a format that the helm chart expects.
  const values = mapCustomEnvironmentVariables(deployment, updatedVariables);

  // Add an annotation to Airflow pods to inform pods to restart when
  // secrets have been changed
  const buf = Buffer.from(JSON.stringify(updatedVariables));

  const hash = crypto
    .createHash("sha512")
    .update(buf)
    .digest("hex");

  // This annotation is a sha512 hash of the user-provided Airflow environment variables
  values.airflowPodAnnotations = { "checksum/airflow-secrets": hash };

  // Update the deployment, passing in our custom env vars.
  await ctx.commander.request("updateDeployment", {
    releaseName: deployment.releaseName,
    chart: {
      name: DEPLOYMENT_AIRFLOW,
      version: deployment.version
    },
    namespace,
    rawConfig: JSON.stringify(generateHelmValues(deployment, values))
  });

  // Run the analytics track event
  track(ctx.user.id, "Updated Deployment Variables", {
    deploymentId: deploymentUuid
  });

  // Remove secret values from response
  const cleanVariables = map(updatedVariables, v => ({
    key: v.key,
    value: v.isSecret ? "" : v.value,
    isSecret: v.isSecret
  }));

  // Return final result
  return sortVariables(cleanVariables);
}
