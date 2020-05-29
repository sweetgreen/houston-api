import { userQuery } from "../../../lib/users";

/*
 * Get list of users.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return users on this specific workspace
 */
export default async function workspaceUsers(parent, args, ctx) {
  const query = userQuery(args);

  return ctx.prisma.user.findMany({
    where: {
      roleBindings_some: {
        workspace: { id: args.workspaceUuid }
      },
      ...query
    }
  });
}
