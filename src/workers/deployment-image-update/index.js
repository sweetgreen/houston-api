import "dotenv/config";
import { prisma } from "generated/client";
import commander from "commander";
import log from "logger";
import { generateNamespace } from "deployments/naming";
import { generateHelmValues } from "deployments/config";
import { natsPubSub } from "nats-streaming";
import { DEPLOYMENT_AIRFLOW, DEPLOYMENT_IMAGE_UPDATED } from "constants";

const nc = createNatsClient();

/**
 * NATS Deployment Update Worker
 */
function createNatsClient() {
  const clientID = "deployment-image-update-worker";
  const subject = DEPLOYMENT_IMAGE_UPDATED;
  const nc = natsPubSub(clientID, subject, helmUpdateDeployment);
  log.info(`NATS ${clientID} Running...`);

  return nc;
}

/**
 * @param  {Object} natsMessage
 */
export async function helmUpdateDeployment(natsMessage) {
  const id = natsMessage.getData();
  try {
    const deployment = await getDeploymentById(id);
    const { releaseName } = deployment;

    await commanderUpdateDeployment(deployment);
    publishUpdateDeployed(id);
    natsMessage.ack();
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
  const deployedSubject = `${DEPLOYMENT_IMAGE_UPDATED}.deployed`;

  nc.publish(deployedSubject, id);
}

export default nc;
