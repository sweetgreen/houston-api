import { prisma } from "generated/client";
import { createDatabaseForDeployment } from "deployments/database";
import commander from "commander";
import {
  generateNamespace,
  generateDeploymentLabels
} from "deployments/naming";
import { generateHelmValues } from "deployments/config";
import bcrypt from "bcryptjs";
import { generate as generatePassword } from "generate-password";
import nats from "nats";
import {
  DEPLOYMENT_AIRFLOW,
  ROLLOUT_STATUS_STARTED,
  ROLLOUT_STATUS_DEPLOYED
} from "constants";

// Create NATS client.
const nc = nats.connect();

/*
 * Handle a deployment rollout creation.
 */
nc.subscribe("houston.rollout.created", async function(msg) {
  // Update the status in the datbase and grab some information.
  const { version, deployment } = await prisma
    .updateRollout({
      where: { id: msg },
      data: { status: ROLLOUT_STATUS_STARTED }
    })
    .$fragment(
      `{ id, version, config, deployment { id, releaseName, extraAu, workspace { id } } }`
    );

  // Notify that we've started the process.
  nc.publish("houston.rollout.started", msg);

  // Grab the releaseName of the deployment.
  const releaseName = deployment.id;

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

  // If we have environment variables, send to commander.
  // TODO: The createDeployment commander method currently
  // allows you to pass secrets to get created,
  // but the implementation does not quite work.
  // This call can be consolidated once that is fixed up in commander.
  // await commander.request("setSecret", {
  //   release_name: releaseName,
  //   namespace: generateNamespace(releaseName),
  //   secret: {
  //     name: generateEnvironmentSecretName(releaseName),
  //     data: arrayOfKeyValueToObject(args.env)
  //   }
  // });

  // XXX: Remove me, just a simulation of commander
  await new Promise(r => setTimeout(r, 10000));

  // Update the status of the rollout, and some deployment details.
  await prisma.updateRollout({
    where: { id: msg },
    data: {
      status: ROLLOUT_STATUS_DEPLOYED,
      deployment: {
        update: {
          registryPassword: hashedRegistryPassword,
          elasticsearchPassword: hashedElasticsearchPassword
        }
      }
    }
  });

  // Notify that we've deployed the rollout
  nc.publish("houston.rollout.deployed", msg);
});
