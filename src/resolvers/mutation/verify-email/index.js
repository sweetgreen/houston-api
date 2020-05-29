import { ResourceNotFoundError } from "errors";
import { first } from "lodash";
import { USER_STATUS_ACTIVE } from "constants";

/*
 * Verify a users email address.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Deployment} The updated Deployment.
 */
export default async function verifyEmail(parent, args, ctx) {
  // Pull out the email address.
  const { email } = args;
  const users = await ctx.prisma.user.findMany({
    where: {
      emails: {
        every: {
          address: email
        }
      }
    },
    select: { id: true }
  });

  // There should be one or none.
  const user = first(users);

  // Throw error if user not found.
  if (!user) throw new ResourceNotFoundError();

  // Update email to be verified.
  const where = { id: user.id };
  const data = {
    emails: {
      update: { where: { address: email }, data: { verified: true } }
    },
    status: USER_STATUS_ACTIVE
  };
  await ctx.prisma.user.update({ where, data });

  // Always return true.
  return true;
}
