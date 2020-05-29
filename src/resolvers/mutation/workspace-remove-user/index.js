/*
 * Remove a user from a workspace.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Workspace} The Workspace.
 */
export default async function workspaceRemoveUser(parent, args, ctx) {
  // Pull out some args, ignoring email - remove later.
  const { userUuid, workspaceUuid } = args;

  // Remove the RoleBinding.
  const where = { workspace: { id: workspaceUuid }, user: { id: userUuid } };
  await ctx.prisma.roleBindings.delete({ where });

  // Return the workspace.
  return ctx.prisma.workspace.findOne({ where: { id: workspaceUuid } });
}
