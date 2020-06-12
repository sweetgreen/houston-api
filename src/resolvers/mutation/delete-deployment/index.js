import fragment from "./fragment";
import { track } from "analytics";
import { generateNamespace } from "deployments/naming";
import { addFragmentToInfo } from "graphql-binding";
import config from "config";
import nats from "nats";

// Create NATS client.
const nc = nats.connect();

/*
 * Delete a deployment.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Deployment} The deleted Deployment.
 */
export default async function deleteDeployment(parent, args, ctx, info) {
  // Soft delete the record from the database.
  const deployment = await ctx.db.mutation.updateDeployment(
    {
      where: { id: args.deploymentUuid },
      data: { deletedAt: new Date() }
    },
    addFragmentToInfo(info, fragment)
  );

  // Run the analytics track event
  track(ctx.user.id, "Deleted Deployment", {
    deploymentId: args.deploymentUuid,
    label: deployment.label,
    releaseName: deployment.releaseName
  });

  // Delete deployment from helm.
  await ctx.commander.request("deleteDeployment", {
    releaseName: deployment.releaseName,
    namespace: generateNamespace(deployment.releaseName),
    deleteNamespace: !config.get("helm.singleNamespace")
  });

  return deployment;
}
