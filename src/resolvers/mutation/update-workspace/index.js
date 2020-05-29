import { pick } from "lodash";
/*
 * Update a Workspace.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {User} The updated User.
 */
export default function updateWorkspace(parent, args, ctx) {
  // The external facing schema is too loose as JSON.
  // For now, we just pluck out any props that are not in this list.
  const data = pick(args.payload, ["label", "description"]);
  const where = { id: args.workspaceUuid };
  return ctx.prisma.workspace.update({ where, data });
}
