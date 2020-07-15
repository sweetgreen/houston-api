import getDeploymentServiceAccounts from "deployment-service-accounts";

/*
 * Get a list of deployment service accounts
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {[ServiceAccount]} The service accounts.
 */
export default async function deploymentServiceAccounts(
  parent,
  args,
  ctx,
  info
) {
  return getDeploymentServiceAccounts(args.deploymentUuid, ctx, info);
}
