import { InvalidResetToken } from "errors";
import bcrypt from "bcryptjs";

/*
 * Generate a token. This is the login mutation.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {AuthToken} The auth token.
 */
export default async function resetPassword(parent, args, ctx) {
  const localCred = await ctx.prisma.localCredential.findOne({
    where: { resetToken: args.token },
    include: { user: true }
  });

  if (!localCred) {
    throw new InvalidResetToken();
  }

  // Hash password.
  const password = await bcrypt.hash(args.password, 10);

  await ctx.prisma.localCredential.update({
    where: { id: localCred.id },
    data: { resetToken: null, password: password }
  });

  // Return our user id, AuthUser resolver takes it from there.
  return { userId: localCred.user.id };
}
