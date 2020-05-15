import { inviteQuery } from "../../../lib/invites";
/*
 * Get a list of invites for a workspace,
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {[]Invites} A list of invites.
 */
export default async function workspaceInvites(parent, args, ctx) {
  // Build the users query.
  const query = inviteQuery(args);

  // Run final query
  return await ctx.db.query.inviteTokens({
    where: {
      workspace: { id: args.workspaceUuid },
      ...query
    }
  });
}
