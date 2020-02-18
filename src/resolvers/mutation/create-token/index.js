import {
  ResourceNotFoundError,
  CredentialsNotFoundError,
  InvalidCredentialsError,
  EmailNotConfirmedError
} from "errors";
import { track } from "analytics";
import bcrypt from "bcryptjs";
import { first } from "lodash";
import { USER_STATUS_ACTIVE, USER_STATUS_PENDING } from "constants";

/*
 * Generate a token. This is the login mutation.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {AuthToken} The auth token.
 */
export default async function createToken(parent, args, ctx) {
  // Search for a user by username or email.
  const users = await ctx.db.query.users(
    {
      where: {
        OR: [
          {
            username: args.identity
          },
          {
            emails_every: {
              address: args.identity
            }
          }
        ]
      }
    },
    `{ id, status, localCredential { password } }`
  );

  // There should be one or none.
  const user = first(users);

  // Throw error if user not found.
  if (!user) throw new ResourceNotFoundError();

  // Throw error if we don't have credentials for this user.
  if (!user.localCredential) throw new CredentialsNotFoundError();

  // Check the password.
  const valid = await bcrypt.compare(
    args.password,
    user.localCredential.password
  );

  // Throw error if we don't have a match.
  if (!valid) throw new InvalidCredentialsError();

  // Check the user status. We do this now after checking the password so that
  // we don't disclose information about account unless they know the u+p
  switch (user.status) {
    case USER_STATUS_ACTIVE:
      break;
    case USER_STATUS_PENDING:
      throw new EmailNotConfirmedError();
    default:
      // Banned, Inactive etc. Treat them all as "invalid password" to the user.
      throw new InvalidCredentialsError();
  }

  // Run the analytics track event
  track(user.id, "Logged In", {
    email: args.identity,
    method: "Local"
  });

  // Return our user id, AuthUser resolver takes it from there.
  return { userId: user.id };
}
