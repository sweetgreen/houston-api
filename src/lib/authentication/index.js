import { getAuthUser } from "rbac";
import { getCookieName } from "utilities";
import { PrismaClient } from "@prisma/client";

/*
 * Express middleware for Authentication. Grabs a JWT
 * from the authorization header or cookie and decodes it,
 * setting a userId on the req.session. This will be
 * undefined if no token was found or invalid.
 * @param {Object} req The express request.
 * @param {Object} res The express response.
 * @param {Function} next Calls the next middleware.
 */
export function authenticateRequest(prisma) {
  return async function(req, res, next) {
    // Set up the session object on every request.
    req.session = {};

    // Grab token from header, or cookie.
    const authHeader = (req.get("Authorization") || "").replace("Bearer ", "");
    const token = authHeader || req.cookies[getCookieName()];

    // Set the user on the request session if we have one.
    req.session.user = await getAuthUser(prisma, token);

    // Pass execution downstream.
    next();
  };
}

/* This is an onConnect handler for Apollo Server subscriptions.
 * This is functionally equivalent to the express middleware above,
 * except for websockets.
 * @return {Object} Object to merged to context for downstream resolvers.
 */
export async function wsOnConnect(connParams) {
  // Parse the token out of connParams.
  const token = (
    connParams.authorization ||
    connParams.Authorization ||
    ""
  ).replace("Bearer ", "");

  const prisma = new PrismaClient();
  // Find the user
  const user = await getAuthUser(prisma, token);

  await prisma.disconnect();
  // If we have a user, return it in a structure that mimics the normal
  // authentication middleware above. It will get merged into the context
  // and will work just like normal with downstream resolvers, including
  // the auth directive. If we don't have a user, return false and the
  // subscription will not start.
  return user ? { req: { session: { user } } } : false;
}
