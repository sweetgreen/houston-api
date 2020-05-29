import {
  InvalidRoleError,
  MissingRoleBindingError,
  NoSystemAdminError
} from "errors";
import { first, get, size, startsWith } from "lodash";

/*
 * Delete a system role binding.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 */
export default async function deleteSystemRoleBinding(parent, args, ctx) {
  // Pull out some args.
  const { userId, role } = args;

  // Throw error if system role not specified.
  if (!startsWith(args.role, "SYSTEM")) throw new InvalidRoleError();

  // Check if the RoleBinding exists. If not, throw error.
  const roleBindings = await ctx.prisma.roleBinding.findMany({
    where: { role, user: { id: userId } }
  });
  if (size(roleBindings) === 0) throw new MissingRoleBindingError();

  // Throw error if there are less than 2 users with role SYSTEM_ADMIN.
  if (role === "SYSTEM_ADMIN") {
    const systemAdmins = await ctx.prisma.roleBinding.findMany({
      where: { role }
    });
    if (systemAdmins.length < 2) throw new NoSystemAdminError();
  }

  // Delete RoleBinding.
  return ctx.prisma.roleBinding.delete({
    where: {
      id: get(first(roleBindings), "id")
    }
  });
}
