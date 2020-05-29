import { UserInviteExistsError } from "errors";
import { ui } from "utilities";
import { group } from "analytics";
import { sendEmail } from "emails";
import { UserInputError } from "apollo-server";
import shortid from "shortid";
import { ENTITY_WORKSPACE, INVITE_SOURCE_WORKSPACE } from "constants";

/*
 * Add a user to a workspace.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {User} The updated Workspace.
 */
export default async function workspaceAddUser(parent, args, ctx) {
  // Pull out some args.
  const { email, workspaceUuid } = args;
  let { role } = args;

  // Check for user by incoming email arg.
  const emailRow = await ctx.prisma.email.findOne({
    where: { address: email.toLowerCase() }
  });

  if (!role.startsWith(`${ENTITY_WORKSPACE}_`))
    throw new UserInputError("invalid workspace role");

  const user = emailRow ? emailRow.user : null;

  // If we already have a user, create the role binding to the workspace.
  if (user) {
    await ctx.prisma.roleBinding.create({
      data: {
        role,
        user: { connect: { id: user.id } },
        workspace: { connect: { id: workspaceUuid } }
      }
    });

    // Run the group event to bucket user into workspace
    group(user.id, workspaceUuid, null);
  } else {
    // Check if we have an invite for incoming email and user.
    const existingInvites = await ctx.prisma.inviteToken.findMany({
      where: {
        email: email.toLowerCase(),
        workspace: { id: workspaceUuid }
      }
    });
    if (existingInvites.length > 0) throw new UserInviteExistsError();

    const token = shortid.generate();
    // Create the invite token if we didn't already have one.
    // Multi-column unique fields would be nice, but not supported yet
    // https://github.com/prisma/prisma/issues/3405
    const res = await ctx.prisma.inviteToken.create({
      data: {
        email: email.toLowerCase(),
        token,
        role,
        workspace: { connect: { id: workspaceUuid } },
        source: INVITE_SOURCE_WORKSPACE
      }
    });

    sendEmail(email, "user-invite", {
      strict: true,
      UIUrl: ui(),
      token,
      workspaceLabel: res.workspace && res.workspace.label
    });
    // Run the group event to bucket user into workspace
    // Note, we can use the inviteId here because it will be the same as the
    // userId once the user accepts the invite
    group(res.id, workspaceUuid, null);
  }

  // Return the workspace.
  return ctx.prisma.workspace.findOne({
    where: { id: workspaceUuid }
  });
}
