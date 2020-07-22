import "dotenv/config";
import createDeploymentFragment from "./fragment";
import { prisma } from "generated/client";
import commander from "commander";
import {
  generateNamespace,
  generateDeploymentLabels
} from "deployments/naming";
import { createDatabaseForDeployment } from "deployments/database";
import { generateHelmValues } from "deployments/config";
import log from "logger";
import { pubSub } from "nats-streaming";
import bcrypt from "bcryptjs";
import { generate as generatePassword } from "generate-password";
import {
  DEPLOYMENT_CREATED,
  DEPLOYMENT_AIRFLOW,
  DEPLOYMENT_CREATED_ID,
  DEPLOYMENT_CREATED_DEPLOYED,
  DEPLOYMENT_CREATED_STARTED
} from "constants";

/**
 * NATS Deployment Update Worker
 */
const nc = pubSub(DEPLOYMENT_CREATED_ID, DEPLOYMENT_CREATED, deploymentCreated);
log.info(`NATS ${DEPLOYMENT_CREATED_ID} Running...`);

/*
 * Handle deployment rollout creation.
 */
export async function deploymentCreated(msg) {
  try {
    // Grab the deploymentId from the message.
    const id = msg.getData();

    log.info(
      `NATS publishing message ${DEPLOYMENT_CREATED_STARTED} for ${id}.`
    );
    // Notify that we've started the process.
    nc.publish(DEPLOYMENT_CREATED_STARTED, id);

    // Update the status in the database and grab some information.
    const deployment = await prisma
      .deployment({ id })
      .$fragment(createDeploymentFragment);

    // // Grab the releaseName and version of the deployment.
    const { releaseName, version } = deployment;

    // // Create the database for this deployment.
    const {
      metadataConnection,
      resultBackendConnection
    } = await createDatabaseForDeployment(deployment);

    const options = { length: 32, numbers: true };
    // Generate a unique registry password for this deployment.
    const registryPassword = generatePassword(options);
    const hashedRegistryPassword = await bcrypt.hash(registryPassword, 10);

    // Generate a unique elasticsearch password for this deployment
    const elasticsearchPassword = generatePassword(options);
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
    const fernetKey = Buffer.from(
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
        version
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
    nc.publish(DEPLOYMENT_CREATED_DEPLOYED, id);
    // Ack the message
    msg.ack();
    log.info(`Created Deployment ${releaseName}`);
  } catch (err) {
    log.error(err);
  }
}

export default nc;
