import { track } from "analytics";
import { generateNamespace } from "deployments/naming";
import config from "config";

/*
 * Delete a deployment.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Deployment} The deleted Deployment.
 */
export default async function deleteDeployment(parent, args, ctx) {
  // Soft delete the record from the database.
  const deployment = await ctx.prisma.deployment.update({
    where: { id: args.deploymentUuid },
    data: { deletedAt: new Date() }
  });

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
