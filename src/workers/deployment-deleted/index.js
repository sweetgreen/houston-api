import { pubSub } from "nats-streaming";
import { prisma } from "generated/client";
import commander from "commander";
import log from "logger";
import { generateNamespace } from "deployments/naming";
import config from "config";
import {
  DEPLOYMENT_DELETED_ID,
  DEPLOYMENT_DELETED,
  DEPLOYMENT_DELETED_DEPLOYED,
  DEPLOYMENT_DELETED_STARTED
} from "constants";

/**
 * NATS Deployment Delete Worker
 */
const nc = pubSub(DEPLOYMENT_DELETED_ID, DEPLOYMENT_DELETED, deploymentDeleted);
log.info(`NATS ${DEPLOYMENT_DELETED_ID} Running...`);

/*
 * Handle a deployment deletion.
 */
export async function deploymentDeleted(msg) {
  try {
    const id = msg.getData();
    nc.publish(DEPLOYMENT_DELETED_STARTED, id);

    const deployment = await getDeploymentByID(id);
    const { releaseName } = deployment;
    await commanderDeleteDeployment(deployment);

    nc.publish(DEPLOYMENT_DELETED_DEPLOYED, id);

    // Ack the message
    msg.ack();
    log.info(`Deployment ${releaseName} successfully deleted`);
  } catch (err) {
    log.error(err);
  }
}

/**
 * @param  {String} id deployment id
 * @return {Object} deployment
 */
async function getDeploymentByID(id) {
  return await prisma.deployment({ id }).$fragment(`{ releaseName }`);
}

/**
 * Commander Delete Deployment request
 * @param  {Object} deployment
 */
async function commanderDeleteDeployment(deployment) {
  const { releaseName } = deployment;
  const namespace = generateNamespace(releaseName);
  const deleteNamespace = !config.get("helm.singleNamespace");

  // Delete deployment from helm.
  await commander.request("deleteDeployment", {
    releaseName,
    namespace,
    deleteNamespace
  });
}

export default nc;
