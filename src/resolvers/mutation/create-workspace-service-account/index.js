import fragment from "./fragment";
import validateExistence from "service-accounts/existence";
import { addFragmentToInfo } from "graphql-binding";
import crypto from "crypto";

/*
 * Create a workspace service account.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {ServiceAccount} The new ServiceAccount.
 */
export default async function createWorkspaceServiceAccount(
  parent,
  args,
  ctx,
  info
) {
  // Pull out some variables.
  const { label, category, workspaceUuid, role } = args;

  // Validate if service account label exists or not
  await validateExistence({ label, workspaceUuid });

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
          workspace: {
            connect: { id: workspaceUuid }
          }
        }
      }
    }
  };

  // Run the mutation.
  return ctx.db.mutation.createServiceAccount(
    mutation,
    addFragmentToInfo(info, fragment)
  );
}
