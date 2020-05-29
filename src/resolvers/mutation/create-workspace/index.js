import { track, group } from "analytics";
import config from "config";
import moment from "moment";
import { WORKSPACE_ADMIN } from "constants";

/*
 * Create a new workspace.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {AuthToken} The workspace.
 */
export default async function createWorkspace(parent, args, ctx) {
  const trialDuration = config.get("trial.length");
  const trialEndsAt = moment()
    .add(trialDuration, "d")
    .format();

  // Create Workspace
  const workspace = await ctx.prisma.workspace.create({
    data: {
      label: args.label,
      description: args.description,
      roleBindings: {
        create: {
          role: WORKSPACE_ADMIN,
          user: { connect: { id: ctx.user.id } }
        }
      },
      isSuspended: false,
      trialEndsAt
    }
  });

  // Run the analytics track event
  track(ctx.user.id, "Created Workspace", {
    workspaceId: workspace.id,
    label: workspace.label,
    description: workspace.description,
    trialEndsAt: workspace.trialEndsAt
  });

  // Run the group event to bucket user into workspace
  group(ctx.user.id, workspace.id, {
    name: workspace.label,
    description: workspace.description,
    trialEndsAt: workspace.trialEndsAt
  });

  return workspace;
}
