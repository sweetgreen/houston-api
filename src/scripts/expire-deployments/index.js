/*
 * Script to soft delete expired deployments
 */
import "dotenv/config";
import log from "logger";
import commander from "commander";
import { prisma } from "generated/client";
import { generateNamespace } from "deployments/naming";
import config from "config";

/*
 * Soft deletion of expired deployments
 */
async function expireDeployments() {
  log.info("Starting soft deletion of expired deployments");

  const expireDate = new Date();

  log.info(`Searching for deployments that expired before ${expireDate}`);

  // Find all suspended deployments.
  const deployments = await prisma
    .deployments({
      where: { deletedAt: null, workspace: { trialEndsAt_lte: expireDate } }
    })
    .$fragment(`{ id releaseName workspace { id trialEndsAt } }`);

  log.info(`Found ${deployments.length} deployments to expire.`);

  // Return early if we have no deployments.
  if (deployments.length === 0) return;

  for (const deployment of deployments) {
    // Pull out some deployment fields.
    const { releaseName, id } = deployment;

    log.info(`Updating expired deployment ${releaseName}`);

    // Update the database.
    await prisma.updateDeployment({
      where: { id },
      data: { deletedAt: new Date() }
    });

    // Delete deployment from helm.
    await commander.request("deleteDeployment", {
      releaseName: deployment.releaseName,
      namespace: generateNamespace(deployment.releaseName),
      deleteNamespace: !config.get("helm.singleNamespace")
    });
  }

  log.info("Soft deletion of expired deployments has been finished!");
}

// When a file is run directly from Node, require.main is set to its module.
if (require.main === module) {
  expireDeployments().catch(err => {
    log.error(err);
  });
}
