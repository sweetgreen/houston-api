import { natsFactory } from "../nats-factory";
import commander from "commander";
import log from "logger";
import { generateNamespace } from "deployments/naming";
import { generateHelmValues } from "deployments/config";
import { DEPLOYMENT_AIRFLOW, REGISTRY_EVENT_UPDATED } from "constants";

const clusterID = "test-cluster";
const clientID = "deployment-deleted";
const subject = REGISTRY_EVENT_UPDATED;

// Create NATS client.
const nc = natsFactory(clusterID, clientID, subject, helmUpdateDeployment);

export async function helmUpdateDeployment(natsMessage) {
  const message = natsMessage.getData();
  const deployment = JSON.parse(message);
  const { id, releaseName, version } = deployment;
  const namespace = generateNamespace(releaseName);
  const helmValues = generateHelmValues(deployment);
  const rawConfig = JSON.stringify(helmValues);
  const name = DEPLOYMENT_AIRFLOW;
  const chart = {
    name,
    version
  };
  const deployedSubject = `${REGISTRY_EVENT_UPDATED}.deployed`;

  // Fire the helm upgrade to commander.
  await commander.request("updateDeployment", {
    releaseName,
    chart,
    namespace,
    rawConfig
  });

  nc.publish(deployedSubject, id);

  /// XXX: Remove me, uncomment to simulate an error
  // throw new Error("Something broke here!");

  // Ack the message
  natsMessage.ack();
  log.info(`Deployment ${releaseName} successfully updated`);
}
