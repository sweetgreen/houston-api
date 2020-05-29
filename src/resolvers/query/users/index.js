import { userQuery } from "../../../lib/users";

/*
 * Get list of users.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {[]User} List of Users.
 */
export default async function users(parent, args, ctx) {
  // Build the users query.
  const query = userQuery(args);

  // Run final query
  return ctx.prisma.user.findMany({ where: { ...query } });
}
