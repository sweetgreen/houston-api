import { ncFactory } from "../factory";
import { generateNamespace } from "deployments/naming";
import { prisma } from "generated/client";
import commander from "commander";
import log from "logger";
import {
  generateHelmValues,
  mapCustomEnvironmentVariables
} from "deployments/config";
import crypto from "crypto";
import { DEPLOYMENT_AIRFLOW, DEPLOYMENT_VARS_UPDATED } from "constants";

const clusterID = "test-cluster";
const clientID = "deployment-variables-updated";
const subject = DEPLOYMENT_VARS_UPDATED;
const messageHandler = function(msg) {
  updatedDeploymentVariables(msg).catch(err => log.error(err));
};
// Create NATS client.
const nc = ncFactory(clusterID, clientID, subject, messageHandler);

/*
 * Handle a deployment deletion.
 */
export async function updatedDeploymentVariables(msg) {
  const msgJson = msg.getData();
  const { id, updatedVariables } = JSON.parse(msgJson);

  nc.publish("houston.deployment.variables.update.started", id);

  const deployment = await prisma
    .deployment({ id })
    .$fragment(`{ id, releaseName, version, extraAu, workspace { id } }`);
  const { releaseName, version } = deployment;
  const namespace = generateNamespace(releaseName);

  // Map the user input env vars to a format that the helm chart expects.
  const values = mapCustomEnvironmentVariables(deployment, updatedVariables);
  const rawConfig = JSON.stringify(generateHelmValues(deployment, values));

  // Add an annotation to Airflow pods to inform pods to restart when
  // secrets have been changed
  const buf = Buffer.from(JSON.stringify(updatedVariables));

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
    namespace,
    rawConfig
  });

  nc.publish("houston.deployment.variables.update.deployed", id);

  // /// XXX: Remove me, uncomment to simulate an error
  // // throw new Error("Intentionally throwing for deployment variables updated!");

  // Ack the message
  msg.ack();
  log.info(`Deployment ${releaseName} successfully updated variables`);
}
