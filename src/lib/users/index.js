import { ui } from "utilities";
import {
  PublicSignupsDisabledError,
  InviteTokenNotFoundError,
  InviteTokenEmailError
} from "errors";
import { sendEmail } from "emails";
import { identify } from "analytics";
import config from "config";
import shortid from "shortid";
import { find, head } from "lodash";
import {
  WORKSPACE_ADMIN,
  SYSTEM_ADMIN,
  USER_STATUS_PENDING,
  USER_STATUS_ACTIVE,
  INVITE_SOURCE_SYSTEM
} from "constants";

/*
 * Centralized helper method to create new user in the system.
 */
export async function createUser(ctx, opts) {
  // Pull out some options.
  const { fullName, email, active } = opts;
  const username = opts.username || email;

  const inviteTokens = await ctx.prisma.inviteToken.findMany({
    where: { email },
    include: {
      workspace: true
    }
  });

  // Grab some configuration.
  const emailConfirmation = config.get("emailConfirmation");
  const publicSignups = config.get("publicSignups");

  // Check if this the first signup.
  const first = await isFirst(ctx.prisma);
  const haveInvite = inviteTokens.length > 0;

  // If it's not the first signup and we're not allowing public signups, check for invite.
  if (!first && !publicSignups && !haveInvite) {
    throw new PublicSignupsDisabledError();
  }

  // Determine default status. The user is active (doesn't need email
  // confirming) if any of:
  //
  // - Did caller of this function (else where in the code) say we should
  //   create an active user?
  // - Do we have a valid invite token (which must have come via the same
  //   email we are creating)?
  // - Or if emailConfirmation is turned off in the system
  const status =
    active || haveInvite || !emailConfirmation
      ? USER_STATUS_ACTIVE
      : USER_STATUS_PENDING;
  // Generate an verification token.
  const emailToken = status == USER_STATUS_ACTIVE ? null : shortid.generate();

  // Generate the role bindings.
  const roleBindings = exports.generateRoleBindings(first, inviteTokens);

  // Create our base mutation. Use the invite id if a user has an invite
  // else, use the default random prisma id (for analytics tracking)
  const mutation = {
    username,
    status,
    fullName,
    emails: {
      create: {
        address: email,
        primary: true,
        verified: !!(!emailConfirmation || haveInvite),
        token: emailToken
      }
    },
    roleBindings
  };

  // If we have an invite token, delete it.
  if (haveInvite) {
    // Return the invite ID from the database to use in the
    // user record if the user has an invite
    const inviteToken =
      // If there's a system invite token (ie. from ATC), use that id
      // This will ensure our analytics userIds are consistent
      find(inviteTokens, { source: INVITE_SOURCE_SYSTEM }) ||
      head(inviteTokens);
    // Set the userId to match the inviteId so our analytics user Ids are consistent
    mutation.id = inviteToken.id;
    await ctx.prisma.inviteToken.deleteMany({
      where: {
        id: {
          in: inviteTokens.map(t => t.id)
        }
      }
    });
  }

  // Run the mutation and return id.
  const { id } = await ctx.prisma.user.create({ data: mutation });

  // Run the analytics.js identify call
  identify(id, { name: fullName, email });

  if (emailToken != null) {
    sendEmail(email, "confirm-email", {
      token: emailToken,
      UIUrl: ui(),
      strict: true
    });
  }

  return id;
}

/*
 * Check if we have any users in the system yet.
 * @return {Promise<Boolean> User count is 0
 */
export async function isFirst(prisma) {
  const allUsers = await prisma.user.findMany();
  return allUsers.length == 0;
}

/*
 * Create the role bindings for a new user.
 * @param {Boolean} first If this is the first user.
 * @param {Object} inviteTokens The invite tokens for this address
 */
export function generateRoleBindings(first, inviteTokens) {
  const roleBindings = [];

  inviteTokens.map(token => {
    if (token.workspace) {
      roleBindings.push({
        role: token.role || WORKSPACE_ADMIN,
        workspace: { connect: { id: token.workspace.id } }
      });
    }
  });

  // Add admin role if first signup.
  if (first) {
    roleBindings.push({
      role: SYSTEM_ADMIN
    });
  }

  // Return combined role bindings.
  return { create: roleBindings };
}

/*
 * Validates that an invite token is valid, throws otherwise.
 * @param {String} inviteToken An invite token.
 * @param {String} email The email of the incoming user.
 * @return {InviteToken} All invite tokens for this email address
 */
export async function validateInviteToken(prisma, inviteToken, email) {
  // Return early if no token found.
  if (!inviteToken) return [];

  // Grab the invite token.
  const inviteEmail = await prisma.inviteToken.findOne({
    where: { token: inviteToken }
  }).email;

  // Throw error if token not found.
  if (!inviteEmail) throw new InviteTokenNotFoundError();

  // Throw error if email does not match.
  if (inviteEmail !== email.toLowerCase()) throw new InviteTokenEmailError();

  // Return validated token, and any other tokens for the same email address.
  return await prisma.inviteToken.findMany({
    where: { email: email },
    include: {
      id: true,
      email: true,
      token: true,
      role: true,
      source: true,
      workspace: { id: true }
    }
  });
}

/*
 * Generate default workspace label.
 * @param {Object} args The args for the mutation.
 * @return {String} The workspace label.
 */
export function defaultWorkspaceLabel(opts) {
  const labelName = opts.fullName || opts.username;
  return labelName ? `${labelName}'s Workspace` : "Default Workspace";
}

/*
 * Generate default workspace description.
 * @param {Object} opts The opts for the mutation.
 * @return {String} The workspace description.
 */
export function defaultWorkspaceDescription(opts) {
  const descName = opts.fullName || opts.email || opts.username;
  return descName ? `Default workspace for ${descName}` : "Default Workspace";
}

/*
 * Build the workspaceUsers query based on args.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Object} The user query.
 */
export function userQuery(args) {
  if (!args.user) return null;

  // Pull out some args.
  const { userUuid, fullName, username, email } = args.user;

  // If userUuid, use it.
  if (userUuid) return { id: userUuid };

  // If email, use it
  if (email) return { emails_some: { address: email.toLowerCase() } };

  // If username, use it
  if (username) return { username_contains: username.toLowerCase() };

  // If fullName, use it.
  if (fullName) return { fullName_contains: fullName };

  return null;
}
