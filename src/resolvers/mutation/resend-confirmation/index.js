import { ui } from "utilities";
import { sendEmail } from "emails";
import shortid from "shortid";

/*
 * Resend an email confirmation
 *
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Boolean} Status of the request.
 */
export default async function resendConfirmation(parent, args, ctx) {
  // Check for user by incoming email arg.
  const email = await ctx.prisma.email.findOne({
    where: { address: args.email.toLowerCase() },
    select: { id: true, address: true, verified: true, token: true }
  });

  if (!email || email.verified) {
    return false;
  }

  if (!email.token) {
    email.token = shortid.generate();
    await ctx.prisma.email.update({
      data: { token: email.token },
      where: { id: email.id }
    });
  }
  sendEmail(email.address, "confirm-email", {
    token: email.token,
    strict: true,
    UIUrl: ui()
  });
  return true;
}
