/*
 * Get a single workspace service account
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {AuthConfig} The auth config.
 */
export default async function workspaceServiceAccount(parent, args, ctx) {
  // Pull out some args.
  const { serviceAccountUuid } = args;

  // Run final query
  const serviceAccount = await ctx.prisma.serviceAccount.findOne({
    where: { id: serviceAccountUuid }
  });

  // If we made it here, return the service account.
  return serviceAccount;
}
