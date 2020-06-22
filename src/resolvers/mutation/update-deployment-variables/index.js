import { queryFragment } from "./fragments";
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
import { find, get, merge, orderBy, filter, map } from "lodash";
import crypto from "crypto";
import { DEPLOYMENT_AIRFLOW } from "constants";

/*
 * Update a deployment's environment variables
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return [EnvironmentVariablePayload] The variable payload.
 */
export default async function updateDeploymentVariables(parent, args, ctx) {
  const { config, deploymentUuid, env, releaseName, payload } = args;

  const namespace = generateNamespace(releaseName);
  const secretName = generateEnvironmentSecretName(releaseName);

  // Get Deployment Variables
  const response = await ctx.commander.request("getSecret", {
    namespace,
    name: secretName
  });

  // Get current env variables from commander response
  const currentVariables = objectToArrayOfKeyValue(
    get(response, "secret.data", {})
  );

  // Build payload array for commander
  const newVariables = payload.map(variable => ({
    key: variable.key,
    value: variable.value,
    isSecret: variable.isSecret
  }));

  // Merge current env variables and new variables
  const updatedVariables = await mergeEnvVariables(
    currentVariables,
    newVariables
  );

  // Create array of secret keys as k8s annotations
  const annotations = map(
    filter(updatedVariables, { isSecret: true }),
    i => i.key
  );

  // Send variable values to commander
  await ctx.commander.request("setSecret", {
    release_name: releaseName,
    namespace: namespace,
    secret: {
      name: secretName,
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
  track(ctx.user.id, "Updated Deployment", {
    deploymentId: deploymentUuid,
    config,
    env,
    payload
  });

  // Return final result
  return {
    releaseName,
    deploymentUuid,
    environmentVariables: orderBy(updatedVariables, ["key"], ["asc"])
  };
}

/*
 * Merge env variables before store in k8s annotations
 * @param {Object} currentVariables current environment variables.
 * @param {Object} newVariables new environment variables.
 * @return {Object} Merged environment variables.
 */
export async function mergeEnvVariables(currentVariables, newVariables) {
  // Start with the list of incoming variables, since that defines the intended structure.
  return newVariables.map(function(v) {
    // If this variable is marked as a secret and does not have a value defined,
    // grab the value from the values we already have stored in Kubernetes.
    const { isSecret, value, key } = v;
    if (isSecret && !value) {
      const serverVar = find(currentVariables, { key });
      // Return the new patched env var object.
      // If the value is not found in the existing serverVars, default to an empty string.
      const newValue = get(serverVar, "value", "");
      const existingVars = { value: newValue };
      return merge({}, v, existingVars);
    }
    return v;
  });
}