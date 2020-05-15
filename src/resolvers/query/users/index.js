import fragment from "./fragment";
import { userQuery } from "../../../lib/users";
import { addFragmentToInfo } from "graphql-binding";

/*
 * Get list of users.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {[]Deployment} List of Deployments.
 */
export default async function users(parent, args, ctx, info) {
  // Build the users query.
  const query = userQuery(args);

  // Run final query
  return await ctx.db.query.users(
    {
      where: { ...query }
    },
    addFragmentToInfo(info, fragment)
  );
}
