import { prisma } from "generated/client";
import commander from "commander";
import log from "logger";
import { generateNamespace } from "deployments/naming";
import { generateHelmValues } from "deployments/config";
import { natsFactory } from "workers/nats-factory";
import { DEPLOYMENT_AIRFLOW, REGISTRY_EVENT_UPDATED } from "constants";

const clusterID = "test-cluster";
const clientID = "deployment-deleted";
const subject = REGISTRY_EVENT_UPDATED;

// Create NATS client using our factory.
const nc = natsFactory(clusterID, clientID, subject, helmUpdateDeployment);

export async function helmUpdateDeployment(natsMessage) {
  const id = natsMessage.getData();
  const deployment = await getDeploymentById(id);
  const { releaseName } = deployment;
  const deployedSubject = `${REGISTRY_EVENT_UPDATED}.deployed`;

  await commanderUpdateDeployment(deployment);

  nc.publish(deployedSubject, id);

  /// XXX: Remove me, uncomment to simulate an error
  // throw new Error("Something broke here!");

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
