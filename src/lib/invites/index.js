/*
 * Build the invite query based on args.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Object} The invite query.
 */
export function inviteQuery(args) {
  if (!args.invite) return null;

  // Pull out some args.
  const { inviteUuid: id, email } = args.invite;

  // If we have id, use it.
  if (id) return { id };

  // If we have an email use it.
  if (email) return { email_contains: email.toLowerCase() };

  return null;
}
