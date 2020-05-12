import fragment from "./fragment";
import { addFragmentToInfo } from "graphql-binding";

/*
 * Get workspace
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @param {Object} info The graphql info.
 * @return {Workspace} The Workspace.
 */
export default async function workspace(parent, args, ctx, info) {
  const { workspaceUuid } = args;

  return await ctx.db.query.workspace(
    {
      where: {
        id: workspaceUuid
      }
    },
    addFragmentToInfo(info, fragment)
  );
}
