import { ResourceNotFoundError } from "errors";

/*
 * Delete a System Service Account.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Invite} The deleted Invite.
 */
export default async function deleteSystemServiceAccount(parent, args, ctx) {
  // Pull out some variables.
  const { serviceAccountUuid } = args;

  // Look for the service account.
  const serviceAccount = await ctx.prisma.serviceAccount.findOne({
    where: { id: serviceAccountUuid },
    select: { id: true }
  });

  // Throw if it doesn't exist.
  if (!serviceAccount) throw new ResourceNotFoundError();

  // Delete the record from the database.
  return ctx.prisma.serviceAccount.delete({
    where: { id: serviceAccountUuid },
    select: { id: true }
  });
}
