import fragment from "./fragment";
import { track } from "analytics";
import { generateNamespace } from "deployments/naming";
import { publisher } from "nats-streaming";
import log from "logger";
import { addFragmentToInfo } from "graphql-binding";
import config from "config";
import { DEPLOYMENT_DELETED } from "constants";

/*
 * Delete a deployment.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Deployment} The deleted Deployment.
 */
export default async function deleteDeployment(parent, args, ctx, info) {
  const { deploymentUuid: id } = args;
  // Soft delete the record from the database.
  const deployment = await ctx.db.mutation.updateDeployment(
    {
      where: { id },
      data: { deletedAt: new Date() }
    },
    addFragmentToInfo(info, fragment)
  );
  const { label, releaseName } = deployment;

  log.info(
    `Delete Deployment publishing to ${DEPLOYMENT_DELETED} with ID: ${id}`
  );
  // Create NATS client.
  const nc = publisher(`delete-deployment-${id}`);
  nc.publish(DEPLOYMENT_DELETED, id);
  log.info(
    `Delete Deployment published to ${DEPLOYMENT_DELETED} with ID: ${id}`
  );
  nc.close();

  // Run the analytics track event
  track(ctx.user.id, "Deleted Deployment", {
    deploymentId: id,
    label,
    releaseName
  });

  // TODO: Delete commander request after testing is completed
  // Delete deployment from helm.
  await ctx.commander.request("deleteDeployment", {
    releaseName,
    namespace: generateNamespace(releaseName),
    deleteNamespace: !config.get("helm.singleNamespace")
  });

  return deployment;
}
