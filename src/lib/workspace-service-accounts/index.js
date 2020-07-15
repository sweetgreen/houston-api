import fragment from "./fragment";
import { addFragmentToInfo } from "graphql-binding";

/*
 * Get a list of workspace service accounts
 * @param {Uuid} workspaceUuid ID of the parent resolver.
 * @param {Object} ctx The graphql context.
 * @return {AuthConfig} The auth config.
 */
export default async function getWorkspaceServiceAccounts(
  workspaceUuid,
  ctx,
  info
) {
  // Build query structure.
  const query = {
    where: {
      roleBinding: {
        workspace: { id: workspaceUuid }
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
