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
  const deployments = ctx.db.query.deployments(
    {
      where: { id: args.workspaceUuid, deletedAt: null }
    },
    `{ id }`
  );

  // Don't delete if there are deployments present
  if (deployments && deployments.length > 0) throw new WorkspaceDeleteError();

  // Run the analytics track event
  track(ctx.user.id, "Deleted Workspace", {
    workspaceId: args.workspaceUuid,
    deletedAt: new Date()
  });

  // Delete the record from the database.
  return await ctx.db.mutation.deleteWorkspace(
    {
      where: { id: args.workspaceUuid }
    },
    `{ id }`
  );
}
