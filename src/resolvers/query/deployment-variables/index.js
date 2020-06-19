import { extractVariables } from "deployments/environment-variables";

/*
 * Get list of deployment environment variables
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return [EnvironmentVariablePayload] The variable payload.
 */
export default async function deploymentVariables(parent, args, ctx) {
  return extractVariables(parent, args, ctx);
}
