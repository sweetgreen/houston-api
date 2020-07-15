import getWorkspaceServiceAccounts from "workspace-service-accounts";

/*
 * Get a list of workspace service accounts
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {AuthConfig} The auth config.
 */
export default async function workspaceServiceAccounts(
  parent,
  args,
  ctx,
  info
) {
  return getWorkspaceServiceAccounts(args.workspaceUuid, ctx, info);
}
