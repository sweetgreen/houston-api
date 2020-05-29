/*
 * Get a single workspace
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @param {Object} info The graphql info.
 * @return {[]Workspace} List of workspaces.
 */
export default async function workspace(parent, args, ctx) {
  return await ctx.prisma.workspace.findOne({
    where: { id: args.workspaceUuid },
    select: {
      id: true,
      label: true,
      roleBindings: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      deployments: {
        select: { id: true, releaseName: true, deletedAt: true, label: true }
      }
    }
  });
}
