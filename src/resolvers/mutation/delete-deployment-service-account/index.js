import { ResourceNotFoundError } from "errors";

/*
 * Delete a Deployment Service Account.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Invite} The deleted Invite.
 */
export default async function deleteDeploymentServiceAccount(
  parent,
  args,
  ctx
) {
  // Pull out some variables.
  const { serviceAccountUuid } = args;

  // Look for the service account.
  const serviceAccount = await ctx.prisma.serviceAccount.findOne(
    {
      where: { id: serviceAccountUuid }
    }
    // `{ roleBinding { workspace { id }, deployment { id } } }`
  );

  // Throw if it doesn't exist.
  if (!serviceAccount) throw new ResourceNotFoundError();

  // Delete the record from the database.
  return ctx.prisma.serviceAccount.delete({
    where: { id: serviceAccountUuid }
  });
}
