import {
  generateNamespace,
  generateEnvironmentSecretName
} from "deployments/naming";
import { objectToArrayOfKeyValue } from "deployments/config";

import { get, orderBy, includes, map } from "lodash";

export async function extractVariables(parent, args, ctx) {
  const { releaseName } = args;

  const namespace = generateNamespace(releaseName);
  const secretName = generateEnvironmentSecretName(releaseName);

  // Get variable values from commander
  const commanderValues = await ctx.commander.request("getSecret", {
    namespace: namespace,
    name: secretName
  });
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
  const vars = map(variables, variable => ({
    key: variable.key,
    value: includes(secretKeys, variable.key) ? "" : variable.value,
    isSecret: includes(secretKeys, variable.key)
  }));

  const environmentVariables = orderBy(vars, ["key"], ["asc"]);

  return environmentVariables;
}
