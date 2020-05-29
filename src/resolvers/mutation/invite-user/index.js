import { DuplicateEmailError, UserInviteExistsError } from "errors";
import { ui } from "utilities";
import { sendEmail } from "emails";
import shortid from "shortid";
import { INVITE_SOURCE_SYSTEM } from "constants";

export default async function inviteUser(parent, args, ctx) {
  let { email } = args;
  email = email.toLowerCase();

  // Check for user by incoming email arg.
  const emailRow = await ctx.prisma.email.findOne(
    { where: { address: email } }
    // `{ user { id } }`
  );

  if (emailRow) {
    throw new DuplicateEmailError();
  }

  // Check if we have an invite for incoming email and user.
  // it's workaround before https://github.com/prisma/studio/issues/119
  // TODO: refactor
  const existingInvites = await ctx.prisma.inviteToken.findMany(
    {
      where: { email },
      select: { id: true }
    }
    // `{ aggregate { count } }`
  );
  if (existingInvites.length > 0) throw new UserInviteExistsError();

  const token = shortid.generate();
  // Create the invite token if we didn't already have one.
  // Multi-column unique fields would be nice, but not supported yet
  // https://github.com/prisma/prisma/issues/3405
  const invite = await ctx.prisma.inviteToken.create({
    data: {
      email,
      token,
      source: INVITE_SOURCE_SYSTEM
    },
    select: { id: true, token: true }
  });

  sendEmail(email, "user-invite", {
    strict: true,
    UIUrl: ui(),
    token
  });

  return invite;
}
