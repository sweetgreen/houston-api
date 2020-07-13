import {
  generateNamespace,
  generateEnvironmentSecretName
} from "deployments/naming";
import { objectToArrayOfKeyValue } from "deployments/config";

import { get, orderBy, includes, map, find, merge } from "lodash";

function removeSecretValues(commanderValues) {
  const variables = objectToArrayOfKeyValue(
    get(commanderValues, "secret.data")
  );

  const secretKeys = JSON.parse(
    get(
      commanderValues,
      [
        "secret",
        "annotations",
        // "visibility" flag
        "astronomer.io/hide-from-ui"
      ],
      "[]"
    )
  );
  // Build payload array for results and strip out secrets
  return map(variables, v => ({
    key: v.key,
    value: includes(secretKeys, v.key) ? "" : v.value,
    isSecret: includes(secretKeys, v.key)
  }));
}

export async function sortVariables(variables) {
  return orderBy(variables, ["key"], ["asc"]);
}

export async function extractVariables(parent, args, ctx) {
  const { releaseName } = args;

  const namespace = generateNamespace(releaseName);
  const name = generateEnvironmentSecretName(releaseName);

  // Get variable values from commander
  const commanderValues = await ctx.commander.request("getSecret", {
    namespace,
    name
  });

  const cleanVariables = removeSecretValues(commanderValues);

  const sortedCleanVariables = sortVariables(cleanVariables);

  return sortedCleanVariables;
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
      // If the value is not found in the existing serverVars, default to an empty string.
      const newValue = get(serverVar, "value", "");
      const existingVars = { value: newValue };
      return merge({}, v, existingVars);
    }
    return v;
  });
}
