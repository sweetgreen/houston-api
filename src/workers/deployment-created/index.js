import { ncFactory } from "../factory";
import { prisma } from "generated/client";
import { createDatabaseForDeployment } from "deployments/database";
import commander from "commander";
import log from "logger";
import {
  generateNamespace,
  generateDeploymentLabels
} from "deployments/naming";
import { generateHelmValues } from "deployments/config";
import bcrypt from "bcryptjs";
import { generate as generatePassword } from "generate-password";
import { DEPLOYMENT_AIRFLOW, DEPLOYMENT_CREATED } from "constants";

const clusterID = "test-cluster";
const clientID = "deployment-created";
const subject = DEPLOYMENT_CREATED;
const messageHandler = function(msg) {
  deploymentCreated(msg).catch(err => log.error(err));
};
// Create NATS client.
const nc = ncFactory(clusterID, clientID, subject, messageHandler);

/*
 * Handle a deployment rollout creation.
 */
export async function deploymentCreated(msg) {
  // Grab the deploymentId from the message.
  const id = msg.getData();

  // Update the status in the database and grab some information.
  const deployment = await prisma
    .deployment({ id })
    .$fragment(`{ id, releaseName, version, extraAu, workspace { id } }`);

  // Notify that we've started the process.
  nc.publish("houston.deployment.rollout.started", id);

  // Grab the releaseName and version of the deployment.
  const { releaseName, version } = deployment;

  // Create the database for this deployment.
  const {
    metadataConnection,
    resultBackendConnection
  } = await createDatabaseForDeployment(deployment);

  // Generate a unique registry password for this deployment.
  const registryPassword = generatePassword({ length: 32, numbers: true });
  const hashedRegistryPassword = await bcrypt.hash(registryPassword, 10);

  // Generate a unique elasticsearch password for this deployment
  const elasticsearchPassword = generatePassword({ length: 32, numbers: true });
  const hashedElasticsearchPassword = await bcrypt.hash(
    elasticsearchPassword,
    10
  );

  // Create some ad-hoc values to get passed into helm.
  // These won't be changing so just pass them in on create,
  // and subsequent helm upgrades will use the --reuse-values option.
  const data = { metadataConnection, resultBackendConnection };
  const registry = { connection: { pass: registryPassword } };
  const elasticsearch = { connection: { pass: elasticsearchPassword } };
  const fernetKey = new Buffer(
    generatePassword({ length: 32, numbers: true })
  ).toString("base64");

  // Combine values together for helm input.
  const values = {
    data,
    registry,
    elasticsearch,
    fernetKey
  };

  // Generate the helm input for the airflow chart (eg: values.yaml).
  const helmConfig = generateHelmValues(deployment, values);

  // Fire off createDeployment to commander.
  await commander.request("createDeployment", {
    releaseName,
    chart: {
      name: DEPLOYMENT_AIRFLOW,
      version: version
    },
    namespace: generateNamespace(releaseName),
    namespaceLabels: generateDeploymentLabels(helmConfig.labels),
    rawConfig: JSON.stringify(helmConfig)
  });

  // Update the status of the rollout, and some deployment details.
  await prisma.updateDeployment({
    where: { id },
    data: {
      registryPassword: hashedRegistryPassword,
      elasticsearchPassword: hashedElasticsearchPassword
    }
  });

  // Notify that we've deployed the rollout
  nc.publish("houston.deployment.rollout.deployed", id);

  /// XXX: Remove me, uncomment to simulate an error
  // throw new Error("whoa");

  // Ack the message
  msg.ack();
  log.info(`Deployment ${releaseName} successfully created`);
}
