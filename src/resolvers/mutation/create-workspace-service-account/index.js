import crypto from "crypto";

/*
 * Create a workspace service account.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {ServiceAccount} The new ServiceAccount.
 */
export default async function createWorkspaceServiceAccount(parent, args, ctx) {
  // Pull out some variables.
  const { label, category, workspaceUuid, role } = args;

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
          workspace: { connect: { id: workspaceUuid } },
          user: { connect: { id: ctx.user.id } }
        }
      }
    }
  };

  // Run the mutation.
  return ctx.prisma.serviceAccount.create(mutation);
}
