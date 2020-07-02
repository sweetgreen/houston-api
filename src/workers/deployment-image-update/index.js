import "dotenv/config";
import { prisma } from "generated/client";
import commander from "commander";
import log from "logger";
import { generateNamespace } from "deployments/naming";
import { generateHelmValues } from "deployments/config";
import { pubSub } from "nats-streaming";
import {
  DEPLOYMENT_AIRFLOW,
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
  const id = message.getData();
  try {
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