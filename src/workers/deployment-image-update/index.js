import { prisma } from "generated/client";
import commander from "commander";
import log from "logger";
import { generateNamespace } from "deployments/naming";
import { generateHelmValues } from "deployments/config";
import { natsPubSub, natsPublisher } from "nats-streaming";
import { DEPLOYMENT_AIRFLOW, DEPLOYMENT_IMAGE_UPDATED } from "constants";

/**
 * NATS Deployment Update Worker
 */
export function deploymentImageUpdateWorker() {
  const clientID = "deployment-update";
  const subject = DEPLOYMENT_IMAGE_UPDATED;
  try {
    // Create NATS PubSub Client
    const nc = natsPubSub(clientID, subject, helmUpdateDeployment);
    log.info("NATS Deployment Update Worker Running...");
    return nc;
  } catch (err) {
    log.error(err);
  }
}

/**
 * @param  {Object} natsMessage
 */
export async function helmUpdateDeployment(natsMessage) {
  const id = natsMessage.getData();
  const deployment = await getDeploymentById(id);
  const { releaseName } = deployment;

  await commanderUpdateDeployment(deployment);

  publishUpdateDeployed(id);

  natsMessage.ack();
  log.info(`Deployment ${releaseName} successfully updated`);
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
  return await prisma
    .deployment({ id })
    .$fragment(`{ id, releaseName, version, extraAu, workspace { id } }`);
}
/**
 * @param  {String} id for the deployment
 */
function publishUpdateDeployed(id) {
  const clientID = "registry-event-update";
  const nc = natsPublisher(clientID);
  const deployedSubject = `${DEPLOYMENT_IMAGE_UPDATED}.deployed`;

  nc.publish(deployedSubject, id);
  nc.close();
}

// When a file is run directly from Node, require.main is set to its module.
if (require.main === module) {
  deploymentImageUpdateWorker();
}
