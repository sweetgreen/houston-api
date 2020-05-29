import { userQuery } from "../../../lib/users";
import { ResourceNotFoundError } from "errors";

/*
 * Get a single user on a workspace.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return users on this specific workspace
 */
export default async function workspaceUser(parent, args, ctx) {
  const query = userQuery(args);

  const workspaceUser = await ctx.prisma.user.findOne({
    where: {
      ...query
    }
  });

  if (!workspaceUser) {
    // This user was not in this workspace
    throw new ResourceNotFoundError();
  }

  return workspaceUser;
}
