import { ncFactory } from "../factory";
import { prisma } from "generated/client";
import commander from "commander";
import log from "logger";
import {
  arrayOfKeyValueToObject,
  generateHelmValues,
  mapCustomEnvironmentVariables
} from "deployments/config";
import {
  generateEnvironmentSecretName,
  generateNamespace
} from "deployments/naming";
import config from "config";
import crypto from "crypto";
import { DEPLOYMENT_AIRFLOW, DEPLOYMENT_UPDATED } from "constants";

const clusterID = "test-cluster";
const clientID = "deployment-updated";
const subject = DEPLOYMENT_UPDATED;
// Create NATS client.
const nc = ncFactory(clusterID, clientID, subject, deploymentUpdated);

/*
 * Handle a deployment update.
 */
export async function deploymentUpdated(msg) {
  try {
    // Grab the deploymentId from the message.
    const msgData = msg.getData();
    const { id, env } = JSON.parse(msgData);

    // Update the status in the database and grab some information.
    const deployment = await prisma
      .deployment({ id })
      .$fragment(
        `{ id, config, releaseName, version, extraAu, workspace { id } }`
      );

    // Notify that we've started the process.
    nc.publish("houston.deployment.update.started", id);

    // Grab the releaseName and version of the deployment.
    const { releaseName, version } = deployment;

    // If we're syncing to kubernetes, fire updates to commander.
    if (config.sync) {
      // Set any environment variables.
      await commander.request("setSecret", {
        releaseName,
        namespace: generateNamespace(releaseName),
        secret: {
          name: generateEnvironmentSecretName(releaseName),
          data: arrayOfKeyValueToObject(env)
        }
      });

      // Map the user input env vars to a format that the helm chart expects.
      const values = mapCustomEnvironmentVariables(deployment, env);

      // Add an annotation to Airflow pods to inform pods to restart when
      // secrets have been changed
      const buf = Buffer.from(JSON.stringify(env));
      const hash = crypto
        .createHash("sha512")
        .update(buf)
        .digest("hex");

      // This annotation is a sha512 hash of the user-provided Airflow environment variables
      values.airflowPodAnnotations = { "checksum/airflow-secrets": hash };

      // Update the deployment, passing in our custom env vars.
      await commander.request("updateDeployment", {
        releaseName,
        chart: {
          name: DEPLOYMENT_AIRFLOW,
          version
        },
        namespace: generateNamespace(releaseName),
        rawConfig: JSON.stringify(generateHelmValues(deployment, values))
      });
      // Notify that we've deployed the update
      nc.publish("houston.deployment.update.deployed", id);
      log.info(`Deployment ${releaseName} successfully updated`);
    }

    /// XXX: Remove me, uncomment to simulate an error
    // throw new Error("Intentionally throwing for deployment updated!");

    // Ack the message
    msg.ack();
    log.info(`houston.deployment.updated messaged acked`);
  } catch (err) {
    log.error(err);
  }
}
