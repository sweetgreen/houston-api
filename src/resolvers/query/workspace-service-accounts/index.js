/*
 * Get a list of workspace service accounts
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {AuthConfig} The auth config.
 */
export default async function workspaceServiceAccounts(parent, args, ctx) {
  // Pull out some args.
  const { workspaceUuid } = args;

  // Run final query
  const serviceAccounts = await ctx.prisma.serviceAccount.findMany({
    where: {
      roleBinding: {
        workspace: { id: workspaceUuid }
      }
    }
  });

  // If we made it here, return the service accounts.
  return serviceAccounts;
}
