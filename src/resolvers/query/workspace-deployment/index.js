import fragment from "./fragment";
import { addFragmentToInfo } from "graphql-binding";

/*
 * Get 1 deployment for a workspace.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Deployment} The Deployment.
 */
export default async function workspaceDeployment(parent, args, ctx, info) {
  return await ctx.db.query.deployment(
    {
      where: {
        releaseName: args.releaseName
      }
    },
    addFragmentToInfo(info, fragment)
  );
}
