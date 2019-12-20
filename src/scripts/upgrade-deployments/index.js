/*
 * Script checks for upgrade availability and then checks deployment / customer maintenance windows and
 * issues the calls to commander to upgrade the deployment
 */
import "dotenv/config";
import log from "logger";
import { prisma } from "generated/client";
import commander from "commander";
import { generateHelmValues } from "deployments/config";
import config from "config";
import { DEPLOYMENT_AIRFLOW } from "constants";

/*
 * Upgrade deployments
 */
async function upgradeDeployments() {
  // This is our desired chart version
  const desiredVersion = config.get("deployments.chart.version");

  log.info(`Starting automatic deployment upgrade to ${desiredVersion}`);

  // Find all deployments.
  let deployments;
  try {
    deployments = await prisma
      .deployments({ where: { deletedAt: null } })
      .$fragment(`{ id releaseName version workspace { id } }`);
  } catch (e) {
    // Astronomer 0.10.3 comparability
    log.error(`Error from prisma: ${e}`);
    deployments = await prisma
      .deployments({})
      .$fragment(`{ id releaseName version workspace { id } }`);
  }

  // Return early if we have no deployments.
  if (deployments.length === 0) {
    log.info("There are no deployments to delete");
    return;
  }

  // Loop through and upgrade all deployments.
  for (const deployment of deployments) {
    // Pull out some deployment fields.
    const { version, releaseName } = deployment;

    // Update the database with our desired version.
    const updatedDeployment = await prisma
      .updateDeployment({
        where: { releaseName },
        data: { version: desiredVersion }
      })
      .$fragment(`{ id releaseName extraAu workspace { id } }`);

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
      rawConfig: JSON.stringify(generateHelmValues(updatedDeployment))
    });
  }

  log.info("Automatic deployment upgrade has been finished!");
}

// When a file is run directly from Node, require.main is set to its module.
if (require.main === module) {
  upgradeDeployments().catch(err => {
    log.error(err);
  });
}
