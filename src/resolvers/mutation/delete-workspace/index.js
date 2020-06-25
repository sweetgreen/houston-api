import { WorkspaceDeleteError } from "errors";
import { track } from "analytics";

/*
 * Delete a workspace.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Deployment} The deleted Deployment.
 */
export default async function deleteWorkspace(parent, args, ctx) {
  const deployments = ctx.prisma.deployment.findMany({
    where: { id: args.workspaceUuid, deletedAt: null },
    select: { id: true }
  });

  // Don't delete if there are deployments present
  if (deployments && deployments.length > 0) throw new WorkspaceDeleteError();

  // Run the analytics track event
  track(ctx.user.id, "Deleted Workspace", {
    workspaceId: args.workspaceUuid
  });

  // Delete the workspace record from the database.
  return ctx.prisma.workspace.delete({
    where: { id: args.workspaceUuid }
  });
}
