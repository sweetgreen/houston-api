import "dotenv/config";
import { prisma } from "generated/client";
import log from "logger";
import { pubSub } from "nats-streaming";
import {
  DEPLOYMENT_IMAGE_UPDATE,
  DEPLOYMENT_IMAGE_UPDATE_ID,
  DEPLOYMENT_IMAGE_UPDATE_DEPLOYED
} from "constants";

/**
 * NATS Deployment Update Worker
 */
const nc = pubSub(
  DEPLOYMENT_IMAGE_UPDATE_ID,
  DEPLOYMENT_IMAGE_UPDATE,
  helmUpdateDeployment
);
log.info(`NATS ${DEPLOYMENT_IMAGE_UPDATE_ID} Running...`);

/**
 * @param  {Object} message NATS message
 */
export async function helmUpdateDeployment(message) {
  try {
    const id = message.getData();
    const deployment = await getDeploymentById(id);
    const { releaseName } = deployment;

    await commanderUpdateDeployment(deployment);
    publishUpdateDeployed(id);
    message.ack();
    log.info(`Deployment ${releaseName} successfully updated`);
  } catch (err) {
    log.error(err);
  }
}

/**
 * @param  {Object} deployment from prisma
 */
async function commanderUpdateDeployment(deployment) {
  log.info(`NATS Streaming Update Deployment: ${deployment}`);

  /* TODO: Uncomment after testing STAN is completed and the logs for deployments match
  const { releaseName, version } = deployment;
  const namespace = generateNamespace(releaseName);
  const helmValues = generateHelmValues(deployment);
  const rawConfig = JSON.stringify(helmValues);
  const name = DEPLOYMENT_AIRFLOW;
  const chart = {
    name,
    version
  };

  // Fire the helm upgrade to commander.
  await commander.request("updateDeployment", {
    releaseName,
    chart,
    namespace,
    rawConfig
  });
  */
}

/**
 * @param  {String} id for the deployment to request via prisma
 * @return {Object} deployment if found
 */
async function getDeploymentById(id) {
  const query = { id };
  const fragment = `{ id, releaseName, version, extraAu, workspace { id } }`;

  return await prisma.deployment(query).$fragment(fragment);
}

/**
 * @param  {String} id for the deployment
 */
function publishUpdateDeployed(id) {
  nc.publish(DEPLOYMENT_IMAGE_UPDATE_DEPLOYED, id);
}

export default nc;
