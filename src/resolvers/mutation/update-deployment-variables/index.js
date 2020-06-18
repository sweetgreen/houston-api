import {
  generateEnvironmentSecretName,
  generateNamespace
} from "deployments/naming";
import { track } from "analytics";
import {
  arrayOfKeyValueToObject,
  objectToArrayOfKeyValue
} from "deployments/config";
import { find, get, merge, orderBy, filter, map } from "lodash";
import nats from "node-nats-streaming";
import { DEPLOYMENT_VARS_UPDATED } from "constants";

// Create NATS client.
const nc = nats.connect("test-cluster", "update-deployment-variables");

/**
 * Update a deployment's environment variables
 * @param {Object} _ The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return [EnvironmentVariablePayload] The variable payload.
 */
export default async function updateDeploymentVariables(_, args, ctx) {
  const { deploymentUuid, releaseName } = args;
  const { commander } = ctx;
  const environmentVariables = await updateEnvironmentVariables(
    args,
    commander
  );
  const msg = formatNcMsg(deploymentUuid, environmentVariables);

  nc.publish(DEPLOYMENT_VARS_UPDATED, msg);
  // Run the analytics track event
  track(ctx.user.id, "Updated Deployment", {
    deploymentId: deploymentUuid
  });

  // Return final result
  return {
    releaseName,
    deploymentUuid,
    environmentVariables
  };
}

/**
 * Update a deployment's environment variables
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 */
async function updateEnvironmentVariables(args, commander) {
  const { releaseName, payload } = args;
  const namespace = generateNamespace(releaseName);
  const secretName = generateEnvironmentSecretName(releaseName);
  const existingVariablesQuery = {
    namespace,
    name: secretName
  };
  const commanderVariables = await getCommanderVariables(
    commander,
    existingVariablesQuery
  );
  const newEnvVariables = formatPayloadVariables(payload);
  const updatedVariables = mergeEnvVariables(
    commanderVariables,
    newEnvVariables
  );
  const environmentVariables = sortVariables(updatedVariables);
  const secret = generateSecret(secretName, environmentVariables);
  const setVariablesQuery = {
    release_name: releaseName,
    namespace,
    secret
  };

  // Send variable values to commander
  await commander.request("setSecret", setVariablesQuery);

  return environmentVariables;
}

/**
 * Gets the Commander Variables if any exist
 * @param  {Object} commander graphql commander
 * @param  {Object} getReq commander request object
 */
async function getCommanderVariables(commander, getSecret) {
  const currentVariables = await commander.request("getSecret", getSecret);
  const variables = get(currentVariables, "secret.data", {});
  // Get current env variables from commander response
  return objectToArrayOfKeyValue(variables);
}

/**
 * Sort variables by ascending keys
 * @param  {Object} variables
 * @return {Object} Ascending order environment variables.
 */
function sortVariables(variables) {
  return orderBy(variables, ["key"], ["asc"]);
}

/**
 * Merge env variables before store in k8s annotations
 * @param {Object} currentVariables current environment variables.
 * @param {Object} newVariables new environment variables.
 * @return {Object} Merged environment variables.
 */
export function mergeEnvVariables(currentVariables, newVariables) {
  // Start with the list of incoming variables, since that defines the intended structure.
  return newVariables.map(function(v) {
    // If this variable is marked as a secret and does not have a value defined,
    // grab the value from the values we already have stored in Kubernetes.
    const { isSecret, value, key } = v;
    if (isSecret && !value) {
      const serverVar = find(currentVariables, { key });
      // Return the new patched env var object.
      // If the value is not found in the existing serverVariables, default to an empty string.
      const newValue = get(serverVar, "value", "");
      const existingVariables = { value: newValue };
      return merge({}, v, existingVariables);
    }
    return v;
  });
}

/**
 * Maps the user payload
 * @param  {Object} payload submitted user payload
 * @return {[]Object} mapped key, value and isSecret objects
 */
function formatPayloadVariables(payload) {
  return payload.map(variable => ({
    key: variable.key,
    value: variable.value,
    isSecret: variable.isSecret
  }));
}
/**
 * @param  {String} secretName
 * @param  {Object} environmentVariables
 * @return {Object} The secret for commander
 */
function generateSecret(secretName, environmentVariables) {
  const annotations = generateAnnotations(environmentVariables);
  const data = arrayOfKeyValueToObject(environmentVariables);

  return {
    name: secretName,
    data,
    annotations
  };
}

/**
 * Generate annotations for k8s
 * @param  {Object} envVariables
 * @return {Object} The annotations object
 */
function generateAnnotations(envVariables) {
  const isSecret = { isSecret: true };
  const annotations = map(filter(envVariables, isSecret), i => i.key);

  return { "astronomer.io/hide-from-ui": JSON.stringify(annotations) };
}

/**
 * @param  {String} id
 * @param  {Object} environmentVariables
 * @return {String} Message to publish to NATS
 */
function formatNcMsg(id, environmentVariables) {
  const msg = {
    id,
    environmentVariables
  };

  return JSON.stringify(msg);
}
