import { pick } from "lodash";

/*
 * Update a Deployment Service Account.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {ServiceAccount} The updated ServiceAccount.
 */
export default async function updateDeploymentServiceAccount(
  parent,
  args,
  ctx
) {
  // The external facing schema is too loose as JSON.
  // For now, we just pluck out any props that are not in this list.
  const data = pick(args.payload, ["category", "label"]);
  const where = { id: args.serviceAccountUuid };
  const role = args.payload.role;

  // Get role bindings
  if (role) {
    const roleBindings = await ctx.prisma.roleBinding.findMany({
      where: { serviceAccount: where },
      select: { id: true }
    });

    // Update the rolebinding if included in payload
    if (roleBindings.length > 0) {
      ctx.prisma.roleBinding.update({
        where: { id: roleBindings[0].id },
        data: { role: role }
      });
    }
  }

  return ctx.prisma.serviceAccount.update({ where, data });
}
