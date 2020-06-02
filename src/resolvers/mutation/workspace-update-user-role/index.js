import { ResourceNotFoundError } from "errors";
import { UserInputError } from "apollo-server";
import { ENTITY_WORKSPACE } from "constants";

/*
 * Add a user to a workspace.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {User} The updated Workspace.
 */
export default async function workspaceUpdateUserRole(parent, args, ctx) {
  // Pull out some args.
  const { email, workspaceUuid, role } = args;

  if (!role.startsWith(`${ENTITY_WORKSPACE}_`))
    throw new UserInputError("invalid workspace role");

  // This function uses roleBindings/inviteTokens query because even though we
  // expect the value to be unique Prismas doesn't support multi-column uniques
  // yet :(

  // Check for user by incoming email arg.
  const roleBindings = await ctx.prisma.roleBinding.findMany({
    where: {
      workspace: { id: workspaceUuid },
      user: { emails: { some: { address: email } } }
    }
  });

  if (roleBindings.length == 1) {
    await ctx.prisma.roleBinding.update({
      data: { role },
      where: { id: roleBindings[0].id }
    });

    return role;
  }

  // Not a current user, check for a pending invite;
  const invites = await ctx.prisma.inviteToken.findMany({
    where: {
      workspace: { id: workspaceUuid },
      email
    }
  });

  if (invites.length == 1) {
    await ctx.prisma.inviteToken.update({
      data: { role },
      where: { id: invites[0].id }
    });
    return role;
  }

  throw new ResourceNotFoundError();
}
