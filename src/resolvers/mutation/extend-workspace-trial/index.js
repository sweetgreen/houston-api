import { track } from "analytics";
import moment from "moment";

export default async function extendWorkspaceTrial(parent, args, ctx) {
  const { extraDays, workspaceUuid } = args;
  const getWorkspace = await ctx.db.query.workspace(
    { where: { id: workspaceUuid } },
    `{ label, trialEndsAt }`
  );

  const trialEndsAt = moment(getWorkspace.trialEndsAt, "YYYY-MM-DD")
    .add(extraDays, "d")
    .format();

  const data = { trialEndsAt };

  const where = { id: workspaceUuid };
  const workspace = ctx.db.mutation.updateWorkspace({
    data,
    where
  });

  // Run the analytics track event
  track(ctx.user.id, "Extended Workspace Trial", {
    workspaceId: workspaceUuid,
    label: getWorkspace.label,
    trialEndsAt
  });

  return workspace;
}
