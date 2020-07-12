import deploymentFragment from "./fragment";
import { mergeEnvVariables } from "deployments/environment-variables";
import { prisma } from "generated/client";
import commander from "commander";
import {
  generateEnvironmentSecretName,
  generateNamespace
} from "deployments/naming";
import {
  arrayOfKeyValueToObject,
  objectToArrayOfKeyValue,
  generateHelmValues,
  mapCustomEnvironmentVariables
} from "deployments/config";
import log from "logger";
import { pubSub } from "nats-streaming";
import { get, filter, map } from "lodash";
import crypto from "crypto";
import {
  DEPLOYMENT_AIRFLOW,
  DEPLOYMENT_VARS_UPDATED,
  DEPLOYMENT_VARS_UPDATED_ID,
  DEPLOYMENT_VARS_UPDATED_DEPLOYED
} from "constants";

/**
 * NATS Deployment Update Worker
 */
const nc = pubSub(
  DEPLOYMENT_VARS_UPDATED_ID,
  DEPLOYMENT_VARS_UPDATED,
  deploymentVariablesUpdated
);
log.info(`NATS ${DEPLOYMENT_VARS_UPDATED_ID} Running...`);

/*
 * Handle a deployment deletion.
 */
export async function deploymentVariablesUpdated(msg) {
  try {
    const msgJson = msg.getData();
    const { id, environmentVariables } = JSON.parse(msgJson);

    nc.publish(`${DEPLOYMENT_VARS_UPDATED}.started`, id);

    const deployment = await prisma
      .deployment({ id })
      .$fragment(deploymentFragment);
    // `{ id, releaseName, version, extraAu, workspace { id } }`);
    const { releaseName, version } = deployment;
    const namespace = generateNamespace(releaseName);
    const name = generateEnvironmentSecretName(releaseName);

    // Get Deployment Variables
    const commanderValues = await commander.request("getSecret", {
      namespace,
      name
    });

    // Get current env variables from commander response
    const currentVariables = objectToArrayOfKeyValue(
      get(commanderValues, "secret.data", {})
    );

    // Build payload array for commander
    const newVariables = environmentVariables.map(v => ({
      key: v.key,
      value: v.value,
      isSecret: v.isSecret
    }));

    // Merge current env variables and new variables
    const updatedVariables = await mergeEnvVariables(
      currentVariables,
      newVariables
    );

    // Create array of secret keys as k8s annotations
    const annotations = map(
      filter(updatedVariables, { isSecret: true }),
      i => i.key
    );

    // Send variable values to commander
    await commander.request("setSecret", {
      release_name: releaseName,
      namespace,
      secret: {
        name,
        data: arrayOfKeyValueToObject(updatedVariables),
        annotations: {
          "astronomer.io/hide-from-ui": JSON.stringify(annotations)
        }
      }
    });

    // Map the user input env vars to a format that the helm chart expects.
    const values = mapCustomEnvironmentVariables(deployment, updatedVariables);
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
      rawConfig: JSON.stringify(generateHelmValues(deployment, values))
    });

    nc.publish(DEPLOYMENT_VARS_UPDATED_DEPLOYED, id);

    // Ack the message
    msg.ack();
    log.info(`Deployment ${releaseName} successfully updated variables`);
  } catch (err) {
    log.error(err);
  }
}

export default nc;
