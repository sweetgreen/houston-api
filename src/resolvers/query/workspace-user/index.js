import { userFragment } from "./fragment";
import { userQuery } from "../../../lib/users";
import { ResourceNotFoundError } from "errors";
import { addFragmentToInfo } from "graphql-binding";
import { ApolloError } from "apollo-server";

/*
 * Get a single user on a workspace.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return users on this specific workspace
 */
export default async function workspaceUser(parent, args, ctx, info) {
  // Build the user query.
  const query = userQuery(args);

  const workspaceUsers = await ctx.db.query.users(
    {
      where: {
        roleBindings_some: {
          workspace: { id: args.workspaceUuid }
        },
        ...query
      }
    },
    addFragmentToInfo(info, userFragment)
  );

  if (workspaceUsers.length > 1) {
    throw new ApolloError(
      "workspaceUser query unexpectedly returned more than a single user!"
    );
  }

  if (workspaceUsers.length == 0) {
    // This user was not in this workspace
    throw new ResourceNotFoundError();
  }

  const workspaceUser = workspaceUsers[0];
  return workspaceUser;
}
