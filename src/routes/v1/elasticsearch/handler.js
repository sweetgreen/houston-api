import log from "logger";
import validateDeploymentCredentials from "deployments/validate/authorization";

/*
 * Handle authorization requests from the NGINX ingress controller.
 * @param {Object} req The request.
 * @param {Object} res The response.
 */
export default async function(req, res) {
  const authorization = req.get("authorization");
  if (!authorization || authorization.substr(0, 5) !== "Basic") {
    log.warn(
      `Did not find 'Basic' in authorization header, we are looking for basic HTTP auth`
    );
    return res.sendStatus(401);
  }

  // Pull authorization token out of headers and parse it.
  const token = authorization.substr(6);
  const [authUser, authPassword] = Buffer.from(token, "base64")
    .toString()
    .split(":");

  // Determine if valid authorization credentials
  const isDeploymentValid = await validateDeploymentCredentials(
    authUser,
    authPassword,
    "elasticsearchPassword"
  );

  // If the password matches, return OK, else Unauthorized.
  if (isDeploymentValid) return res.sendStatus(200);
  log.warn(`We did not find the deployment to be valid, returning 401`);
  return res.sendStatus(401);
}
