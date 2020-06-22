import {
  generateNamespace,
  generateEnvironmentSecretName
} from "deployments/naming";
import { objectToArrayOfKeyValue } from "deployments/config";

import { get, orderBy, includes, map } from "lodash";

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
