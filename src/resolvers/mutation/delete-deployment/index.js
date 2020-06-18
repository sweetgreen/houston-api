import fragment from "./fragment";
import { track } from "analytics";
import { addFragmentToInfo } from "graphql-binding";
import nats from "node-nats-streaming";
import { DEPLOYMENT_DELETED } from "constants";

// Create NATS client.
const nc = nats.connect("test-cluster", "delete-deployment");

/*
 * Delete a deployment.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Deployment} The deleted Deployment.
 */
export default async function deleteDeployment(_, args, ctx, info) {
  const { deploymentUuid: deploymentId } = args;
  // Soft delete the record from the database.
  const deployment = await ctx.db.mutation.updateDeployment(
    {
      where: { id: deploymentId },
      data: { deletedAt: new Date() }
    },
    addFragmentToInfo(info, fragment)
  );
  const { id, label, releaseName } = deployment;

  // Run the analytics track event
  track(ctx.user.id, "Deleted Deployment", {
    deploymentId,
    label,
    releaseName
  });

  nc.publish(DEPLOYMENT_DELETED, id);

  return deployment;
}
