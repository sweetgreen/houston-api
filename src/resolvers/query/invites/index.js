import { inviteQuery } from "../../../lib/invites";

/*
 * Get a list of all invites,
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {[]Invites} A list of invites.
 */
export default async function invites(parent, args, ctx) {
  // Build the invite query.
  const query = inviteQuery(args);

  // Run final query
  return await ctx.db.query.inviteTokens({ where: { ...query } });
}
