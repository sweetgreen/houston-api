import fragment from "./fragment";
import { addFragmentToInfo } from "graphql-binding";

/*
 * Get a list of deployment service accounts
 * @param {Uuid} deploymentUuid ID of the parent resolver.
 * @param {Object} ctx The graphql context.
 * @return {[ServiceAccount]} The service accounts.
 */
export default async function getDeploymentServiceAccounts(
  deploymentUuid,
  ctx,
  info
) {
  // Build query structure.
  const query = {
    where: {
      roleBinding: {
        deployment: { id: deploymentUuid }
      }
    }
  };

  // Run final query
  const serviceAccounts = await ctx.db.query.serviceAccounts(
    query,
    addFragmentToInfo(info, fragment)
  );

  // If we made it here, return the service accounts.
  return serviceAccounts;
}
