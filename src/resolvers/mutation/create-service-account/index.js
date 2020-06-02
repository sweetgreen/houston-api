import { hasPermission } from "rbac";
import { PermissionError } from "errors";
import { UserInputError } from "apollo-server";
import crypto from "crypto";
import { ENTITY_DEPLOYMENT, ENTITY_WORKSPACE } from "constants";

/*
 * Create a service account.
 * This resolver has some abnormal behavior since it has to do
 * some extra checks that could not be handled by our auth directive.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {ServiceAccount} The new ServiceAccount.
 */
export default async function createServiceAccount(parent, args, ctx) {
  // Pull out some variables.
  const {
    label,
    category,
    entityType: upperEntityType,
    entityUuid,
    role
  } = args;
  const entityType = upperEntityType.toLowerCase();

  // Make sure we have permission to do this.
  const hasSystemPerm = hasPermission(
    ctx.user,
    "system.serviceAccounts.create"
  );
  const hasUserPerm = hasPermission(
    ctx.user,
    `${entityType}.serviceAccounts.create`,
    entityType,
    entityUuid
  );

  // Throw if we don't have system or user access.
  if (!hasSystemPerm && !hasUserPerm) throw new PermissionError();

  // Validate the role is for the right entity type
  if (
    (role.startsWith(ENTITY_WORKSPACE) &&
      upperEntityType != ENTITY_WORKSPACE) ||
    (role.startsWith(ENTITY_DEPLOYMENT) && upperEntityType != ENTITY_DEPLOYMENT)
  ) {
    throw new UserInputError("Entity and role types don't match");
  }

  // Create the base mutation.
  const mutation = {
    data: {
      label,
      category,
      apiKey: crypto.randomBytes(16).toString("hex"),
      active: true,
      roleBinding: {
        create: {
          role,
          [entityType]: {
            connect: { id: entityUuid }
          }
        }
      }
    }
  };

  // Run the mutation.
  return ctx.prisma.serviceAccount.create(mutation);
}
