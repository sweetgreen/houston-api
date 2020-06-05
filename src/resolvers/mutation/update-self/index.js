import { pick } from "lodash";

/*
 * Update Self.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {User} The updated User.
 */
export default function updateSelf(parent, args, ctx) {
  // The external facing schema is too loose as JSON.
  // For now, we just pluck out any props that are not in this list.
  const data = pick(args.payload, ["fullName"]);
  const where = { id: ctx.user.id };
  return ctx.prisma.user.update({ where, data });
}
