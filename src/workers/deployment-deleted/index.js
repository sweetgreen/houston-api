import { ncFactory } from "../factory";
import { prisma } from "generated/client";
import commander from "commander";
import log from "logger";
import { generateNamespace } from "deployments/naming";
import config from "config";
import { DEPLOYMENT_DELETED } from "constants";

const clusterID = "test-cluster";
const clientID = "deployment-deleted";
const subject = DEPLOYMENT_DELETED;
const messageHandler = function(msg) {
  deploymentDeleted(msg).catch(err => log.error(err));
};
// Create NATS client.
const nc = ncFactory(clusterID, clientID, subject, messageHandler);

/*
 * Handle a deployment deletion.
 */
export async function deploymentDeleted(msg) {
  const id = msg.getData();
  nc.publish("houston.deployment.delete.started", id);

  const deployment = await prisma
    .deployment({ id })
    .$fragment(
      `{ id, config, releaseName, version, extraAu, workspace { id } }`
    );
  const { releaseName } = deployment;
  const namespace = generateNamespace(releaseName);
  const deleteNamespace = !config.get("helm.singleNamespace");

  // Delete deployment from helm.
  await commander.request("deleteDeployment", {
    releaseName,
    namespace,
    deleteNamespace
  });

  nc.publish("houston.deployment.delete.deployed", id);

  // /// XXX: Remove me, uncomment to simulate an error
  // // throw new Error("Intentionally throwing for deployment deleted!");

  // Ack the message
  msg.ack();
  log.info(`Deployment ${releaseName} successfully deleted`);
}
