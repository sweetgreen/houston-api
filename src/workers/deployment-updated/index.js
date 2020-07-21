import updateDeploymentFragment from "./fragment";
import { pubSub } from "nats-streaming";
import { prisma } from "generated/client";
import commander from "commander";
import log from "logger";
import {
  generateHelmValues,
  mapCustomEnvironmentVariables
} from "deployments/config";
import { generateNamespace } from "deployments/naming";
import config from "config";
import {
  DEPLOYMENT_UPDATED,
  DEPLOYMENT_AIRFLOW,
  DEPLOYMENT_UPDATED_ID,
  DEPLOYMENT_UPDATED_STARTED,
  DEPLOYMENT_UPDATED_DEPLOYED
} from "constants";

/**
 * NATS Deployment Update Worker
 */
const nc = pubSub(DEPLOYMENT_UPDATED_ID, DEPLOYMENT_UPDATED, deploymentUpdated);
log.info(`NATS ${DEPLOYMENT_UPDATED_ID} Running...`);

/**
 * Handle a deployment update.
 * @param {Object} msg contains the NATS Streaming message
 */
export async function deploymentUpdated(msg) {
  try {
    // Grab the deploymentId from the message.
    const id = msg.getData();

    // Update the status in the database and grab some information.
    const deployment = await prisma
      .deployment({ id })
      .$fragment(updateDeploymentFragment);

    // Grab the releaseName and version of the deployment.
    const { releaseName, version } = deployment;

    // If we're syncing to kubernetes, fire updates to commander.
    if (config.sync) {
      // TODO: Edge case - check to see if we need to await for nc.connect before publishing
      // Notify that we've started the process.
      nc.publish(DEPLOYMENT_UPDATED_STARTED, id);
      // Map the user input env vars to a format that the helm chart expects.
      const values = mapCustomEnvironmentVariables(deployment);

      // Update the deployment, passing in our custom env vars.
      await commander.request("updateDeployment", {
        releaseName,
        chart: {
          name: DEPLOYMENT_AIRFLOW,
          version
        },
        namespace: generateNamespace(releaseName),
        rawConfig: JSON.stringify(generateHelmValues(deployment, values))
      });
      // TODO: Edge case - check to see if we need to await for nc.connect before publishing
      // Notify that we've deployed the update
      nc.publish(DEPLOYMENT_UPDATED_DEPLOYED, id);
    }

    // Ack the message
    msg.ack();
    log.info(`Deployment ${releaseName} successfully updated`);
  } catch (err) {
    log.error(err);
  }
}

export default nc;
