/*
 * Script checks for upgrade availability and then checks deployment / customer maintenance windows and
 * issues the calls to commander to upgrade the deployment
 */
import "dotenv/config";
import log from "logger";
import { generateNamespace } from "deployments/naming";
import commander from "commander";
import { generateHelmValues } from "deployments/config";
import { PrismaClient } from "@prisma/client";
import config from "config";
import yargs from "yargs";
import { DEPLOYMENT_AIRFLOW } from "constants";

/*
 * Upgrade deployments
 */
async function upgradeDeployments() {
  // This is our desired chart version
  const desiredVersion = config.get("deployments.chart.version");

  log.info(`Starting automatic deployment upgrade to ${desiredVersion}`);

  // Build the deployment query.
  const query = {
    where: {},
    select: {
      id: true,
      version: true,
      releaseName: true,
      workspace: { id: true }
    }
  };

  if (argv["canary"]) {
    log.info(`Limiting search to canary deployments`);
    query.where = { ...query.where, canary: true };
  }

  // Find all deployments.
  let deployments = [];

  const prisma = new PrismaClient();

  try {
    const q1 = {
      where: { ...query.where, deletedAt: null },
      select: {
        id: true,
        version: true,
        releaseName: true,
        workspace: { id: true }
      }
    };
    log.debug(`Query: ${JSON.stringify(q1)}`);
    deployments = await prisma.deployment.findMany(q1);
  } catch (e) {
    // Astronomer 0.10.3 comparability
    log.debug(`Query: ${JSON.stringify(query)}`);
    log.error(`Error from prisma: ${e}`);
    deployments = await prisma.deployment.findMany(query);
  }

  log.info(`Found ${deployments.length} deployments to upgrade.`);

  // Return early if we have no deployments.
  if (deployments.length === 0) return;

  // Loop through and upgrade all deployments.
  for (const deployment of deployments) {
    // Pull out some deployment fields.
    const { version, releaseName } = deployment;

    // Update the database with our desired version.
    const updatedDeployment = await prisma.deployment.update({
      where: { releaseName },
      data: { version: desiredVersion }
    });

    log.info(
      `Applying helm upgrade on ${releaseName}, version ${version} to ${desiredVersion}`
    );

    // Fire the update to commander.
    await commander.request("updateDeployment", {
      releaseName,
      chart: {
        name: DEPLOYMENT_AIRFLOW,
        version: desiredVersion
      },
      namespace: generateNamespace(releaseName),
      rawConfig: JSON.stringify(generateHelmValues(updatedDeployment))
    });
  }

  await prisma.disconnect();

  log.info("Automatic deployment upgrade has been finished!");
}

const argv = yargs
  .option("canary", {
    alias: "c",
    default: false,
    description: "Only run for deployments with canary flag set to true",
    type: "boolean"
  })
  .help()
  .alias("help", "h").argv;

// When a file is run directly from Node, require.main is set to its module.
if (require.main === module) {
  upgradeDeployments().catch(err => {
    log.error(err);
  });
}
