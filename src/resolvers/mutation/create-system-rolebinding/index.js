import { DuplicateRoleBindingError, InvalidRoleError } from "errors";
import { startsWith } from "lodash";

/*
 * Create a system role binding.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 */
export default async function createSystemRoleBinding(parent, args, ctx, info) {
  // Pull out some args.
  const { userId, role } = args;

  // Throw error if system role not specified.
  if (!startsWith(args.role, "SYSTEM")) throw new InvalidRoleError();

  // Check if the RoleBinding already exists. If so, return it.
  const where = { role, user: { id: userId } };
  const roleBinding = await ctx.prisma.roleBinding.findMany({ where });
  if (roleBinding.length > 1) throw new DuplicateRoleBindingError();

  // Otherwise, create and return the RoleBinding.
  return ctx.prisma.roleBinding.create(
    {
      data: {
        user: { connect: { id: userId } },
        role
      }
    },
    info
  );
}
