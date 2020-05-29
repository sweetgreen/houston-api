import { hasPermission } from "rbac";
import { createAuthJWT, setJWTCookie } from "jwt";
import { USER_STATUS_ACTIVE } from "constants";

// Grab the user object for this id.
export function user(parent, args, context) {
  return context.prisma.user.findOne({
    where: { id: parent.userId },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      emails: true,
      fullName: true,
      username: true,
      roleBindings: {
        select: {
          id: true,
          user: true,
          role: true,
          workspace: true,
          deployment: true,
          serviceAccount: true
        }
      }
    }
  });
}

// Generate a JWT using the user id.
export async function token(parent, args, context) {
  const user = await context.prisma.user.findOne({
    where: { id: parent.userId },
    select: {
      status: true
    }
  });

  if (user.status != USER_STATUS_ACTIVE) {
    //  User is not active, so they can't log in
    return null;
  }

  // Create our JWT.
  const { token, payload } = createAuthJWT(parent.userId);

  // Set the cookie.
  setJWTCookie(context.res, token);

  // Return in the legacy format.
  return { value: token, payload };
}

// Return empty permissions currently.
export function permissions() {
  return {};
}

// Return false by default.
export function isAdmin() {
  return false;
}

// Return empty roleBindings
export function roleBindings() {
  return {};
}

/*
 * Return boolean flags indicating what the current user has access to
 * on a particular deployment.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {AuthUserCapabilities} Map of boolean capabilities.
 */
export function authUserCapabilities(parent, args, context) {
  const permissions = [
    {
      key: "canSysAdmin",
      value: "system.airflow.admin"
    }
  ];
  const capabilities = [];
  permissions.map(p => {
    capabilities[p.key] = hasPermission(context.user, p.value);
  });

  return capabilities;
}

// Export AuthUser.
export default { user, token, permissions, isAdmin, authUserCapabilities };
