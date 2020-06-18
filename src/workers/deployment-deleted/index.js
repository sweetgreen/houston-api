import { prisma } from "generated/client";
import commander from "commander";
import log from "logger";
import { generateNamespace } from "deployments/naming";
import nats from "node-nats-streaming";
import config from "config";

const clientID = "deployment-deleted";
// Create NATS client.
const nc = nats.connect("test-cluster", clientID);

// Attach handler
nc.on("connect", function() {
  // Create subscription options
  const opts = nc.subscriptionOptions();
  opts.setDeliverAllAvailable();
  opts.setManualAckMode(true);
  opts.setAckWait(300 * 1000);
  opts.setDurableName(clientID);

  // Subscribe and assign event handler
  const sub = nc.subscribe("houston.deployment.deleted", opts);
  sub.on("message", function(msg) {
    deploymentDeleted(msg).catch(err => log.error(err));
  });
});

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
