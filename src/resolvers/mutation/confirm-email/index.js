import { InvalidToken } from "errors";
import { USER_STATUS_ACTIVE, USER_STATUS_PENDING } from "constants";

/*
 * Generate a token. This is the login mutation.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {AuthUser} The auth token.
 */
export default async function confirmEmail(parent, args, ctx) {
  // Search for a user by username or email.
  const email = await ctx.prisma.email.findOne({
    where: { token: args.token },
    include: { user: true }
  });

  // Throw error if user not found.
  if (!email || !email.user) {
    throw new InvalidToken();
  }

  const mutation = {
    verified: true,
    token: null
  };
  // Check the user status. We do this now after checking the password so that
  // we don't disclose information about account unless they know the u+p
  switch (email.user.status) {
    case USER_STATUS_ACTIVE:
      break;
    case USER_STATUS_PENDING:
      mutation.user = {
        update: {
          status: USER_STATUS_ACTIVE
        }
      };
      break;
    default:
      // Banned, Inactive etc. Treat them all as an invalid token
      throw new InvalidToken();
  }

  await ctx.prisma.email.update({
    where: { token: args.token },
    data: mutation
  });

  // Return our user id, AuthUser resolver takes it from there.
  return { userId: email.user.id };
}
