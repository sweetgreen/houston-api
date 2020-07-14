import {
  sortVariables,
  mergeEnvVariables
} from "deployments/environment-variables";
import validateEnvironment from "deployments/environment-variables/validate";
import {
  generateEnvironmentSecretName,
  generateNamespace
} from "deployments/naming";
import { publisher } from "nats-streaming";
import { track } from "analytics";
import { objectToArrayOfKeyValue } from "deployments/config";
import { get, map } from "lodash";
import { DEPLOYMENT_VARS_UPDATED } from "constants";

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

  const msg = formatNcMsg(args);
  const nc = publisher("update-deployment-variables");
  nc.publish(DEPLOYMENT_VARS_UPDATED, msg);
  nc.close();

  // TODO: Remove everything besides tracking and returning the cleaned variables.

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

/**
 * @param  {String} id
 * @param  {Object} environmentVariables
 * @return {String} Message to publish to NATS
 */
function formatNcMsg(args) {
  const { id, environmentVariables } = args;
  const msg = {
    id,
    environmentVariables
  };

  return JSON.stringify(msg);
}
