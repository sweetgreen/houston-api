import { InvalidCredentialsError } from "errors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { RELEASE_NAME_PATTERN } from "constants";
/*
 * Validate a deployment release and the specified password field.
 * @param {String} releaseName The deployment release name.
 * @param {String} password The password to verify.
 * @param {String} passwordField The name of the field that holds the password.
 * @return {Boolean} If the password is correct or throws.
 */
export default async function validateDeploymentCredentials(
  releaseName,
  password,
  passwordField
) {
  const prisma = new PrismaClient();

  // Return false if no password
  if (!password) return false;

  // Return false is releaseName doesn't look right
  if (!RELEASE_NAME_PATTERN.test(releaseName)) return false;

  // Get the password for this deployment
  const deployment = await prisma.deployment.findOne({
    where: { releaseName: releaseName },
    select: { [passwordField]: true }
  });

  const truePassword = deployment ? deployment[passwordField] : null;
  await prisma.disconnect();

  // Return false if no result.
  if (!truePassword) return false;

  // Check the password
  const valid = await bcrypt.compare(password, truePassword);

  // Throw error if we don't have a match
  if (!valid) throw new InvalidCredentialsError();

  // If we make it here, return true
  return true;
}
