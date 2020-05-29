import { track, group } from "analytics";
import moment from "moment";

export default async function extendWorkspaceTrial(parent, args, ctx) {
  const { extraDays, workspaceUuid } = args;
  const getWorkspace = await ctx.prisma.workspace.findOne(
    { where: { id: workspaceUuid } },
    `{ label, trialEndsAt }`
  );

  const trialEndsAt = moment(getWorkspace.trialEndsAt, "YYYY-MM-DD")
    .add(extraDays, "d")
    .format();

  const data = { trialEndsAt };

  const where = { id: workspaceUuid };
  const workspace = ctx.prisma.workspace.update({
    data,
    where
  });

  // Run the analytics track event
  track(ctx.user.id, "Extended Workspace Trial", {
    workspaceId: workspaceUuid,
    label: getWorkspace.label,
    trialEndsAt
  });

  // Change workspace trialEndsAt date in downstream tools
  group(ctx.user.id, workspaceUuid, {
    trialEndsAt
  });
  return workspace;
}
