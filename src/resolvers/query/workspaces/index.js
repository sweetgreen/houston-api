import { compact } from "lodash";
/*
 * Get list of workspaces for user.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @param {Object} info The graphql info.
 * @return {[]Workspace} List of workspaces.
 */
export default async function workspaces(parent, args, ctx) {
  const workspaceIds = ctx.user.roleBindings.map(rb =>
    rb.workspace ? rb.workspace.id : null
  );

  const workspaces = await ctx.prisma.workspace.findMany({
    where: { id: { in: compact(workspaceIds) } },
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

  // Get the workspaces, using their ids and passing the user specified selection set.
  return workspaces;
}
