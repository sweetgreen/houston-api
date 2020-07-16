import { generateHelmValues } from "deployments/config";
import { publisher } from "nats-streaming";
import { prisma } from "generated/client";
import { createDockerJWT } from "registry/jwt";
import { generateNamespace } from "deployments/naming";
import isValidTaggedDeployment from "deployments/validate/docker-tag";
import log from "logger";
import commander from "commander";
import { version } from "utilities";
import { track } from "analytics";
import { merge, get } from "lodash";
import got from "got";
import {
  MEDIATYPE_DOCKER_MANIFEST_V2,
  DEPLOYMENT_AIRFLOW,
  DEPLOYMENT_IMAGE_UPDATED
} from "constants";

/*
 * Handle webhooks from the docker registry.
 * @param {Object} req The request.
 * @param {Object} res The response.
 */
export default async function(req, res) {
  const { events = [] } = req.body;
  const natsIDs = [];

  await Promise.all(
    events.map(async ev => {
      // Exit early if we don't care about this event or tag.
      if (!isValidTaggedDeployment(ev)) return;

      // Decompose the repository name.
      const [releaseName] = ev.target.repository.split("/");
      const repository = `${ev.request.host}/${ev.target.repository}`;
      const tag = ev.target.tag;
      log.info(
        `Received docker registry webhook for ${releaseName}, deploying new tag ${tag}.`
      );

      const deployment = await prisma
        .deployment({ releaseName })
        .$fragment(`{ config deletedAt airflowVersion }`);

      if (!deployment) {
        log.info(`Deployment not found for ${releaseName}.`);
        return res.sendStatus(200);
      }

      if (deployment.deletedAt) {
        log.info(`Deployment ${releaseName} soft-deleted`);
        return res.sendStatus(200);
      }

      const config = deployment.config;
      if (!config) {
        log.info(`Deployment config not found for ${releaseName}`);
        return res.sendStatus(200);
      }

      let airflowVersion;
      try {
        const imageMetadata = await exports.extractImageMetadata(ev);
        await prisma.upsertDockerImage({
          where: {
            name: `${ev.target.repository}:${tag}`
          },
          update: {
            labels: imageMetadata.labels,
            env: imageMetadata.env,
            digest: ev.target.digest
          },
          create: {
            name: `${ev.target.repository}:${tag}`,
            deployment: {
              connect: { releaseName }
            },
            labels: imageMetadata.labels,
            env: imageMetadata.env,
            tag: tag,
            digest: ev.target.digest
          }
        });
        airflowVersion = get(
          imageMetadata.labels,
          "io.astronomer.docker.airflow.version",
          deployment.airflowVersion
        );
      } catch (e) {
        if (e instanceof got.GotError) {
          log.error(`Error fetching ${e.url} ${e}`);
        } else {
          log.error(`Error upserting image metadata: ${e}`);
        }
        // Don't cause an error here to fail the request, that causes the
        // Registry to keep trying to send the webhook to us!
        return;
      }
      // Merge the new image tag in.
      const updatedConfig = merge({}, config, {
        images: { airflow: { repository, tag } }
      });

      // Update the deployment.
      const updatedDeployment = await prisma
        .updateDeployment({
          where: { releaseName },
          data: { config: updatedConfig, airflowVersion }
        })
        .$fragment(
          `{ id config label releaseName extraAu airflowVersion version workspace { id } }`
        );

      // TODO: Remove commander call after testing that NATS is functional
      // Fire the helm upgrade to commander.
      await commander.request("updateDeployment", {
        releaseName: updatedDeployment.releaseName,
        chart: {
          name: DEPLOYMENT_AIRFLOW,
          version: updatedDeployment.version
        },
        namespace: generateNamespace(releaseName),
        rawConfig: JSON.stringify(generateHelmValues(updatedDeployment))
      });

      const { id: deploymentId, label } = updatedDeployment;
      // Push the deploymentId to the natsIDs array
      // to publish before sending back the 200 status
      natsIDs.push(deploymentId);

      // Run the analytics track event
      track(get(ev, "actor.name"), "Deployed Code", {
        deploymentId,
        label,
        releaseName,
        tag
      });
    })
  );

  // Create NATS client.
  const nc = publisher(`houston-deployment-image-update`);
  natsIDs.forEach(id => {
    nc.publish(DEPLOYMENT_IMAGE_UPDATED, id);
    log.info(
      `V1 Image Update Deployment publishing to ${DEPLOYMENT_IMAGE_UPDATED} for deploymentId ${id}`
    );
  });
  nc.close();

  res.sendStatus(200);
}

export async function extractImageMetadata(ev) {
  if (ev.target.mediaType != MEDIATYPE_DOCKER_MANIFEST_V2) {
    log.debug(`Ignoring non-manifest type ${ev.target.mediaType}`);
    return;
  }

  const expiration = 30;
  const sub = "system";
  const claims = [
    {
      type: "repository",
      actions: ["pull"],
      name: ev.target.repository
    }
  ];
  const dockerJWT = await createDockerJWT(sub, claims, expiration);

  const client = got.extend({
    headers: {
      "User-Agent": `houston/${version()}`
    },
    json: true
  });

  log.info(`Fetching manifest from ${ev.target.url}`);
  const manifest = (
    await client.get(ev.target.url, {
      headers: {
        Accept: MEDIATYPE_DOCKER_MANIFEST_V2,
        Authorization: `Bearer ${dockerJWT}`
      }
    })
  ).body;

  if (!manifest.config) {
    log.debug("No config field in manifest!");
    return;
  }

  const configURL = ev.target.url.replace(
    /manifests\/.*$/,
    `blobs/${manifest.config.digest}`
  );
  log.debug(`Fectching image config from ${configURL}`);

  const { statusCode, headers, body } = await client.get(configURL, {
    headers: {
      Accept: manifest.config.mediaType,
      Authorization: `Bearer ${dockerJWT}`
    },
    followRedirect: false
  });

  // If using Azure Blob registry storage back end, we receive a 307 response code.
  // Solution described here https://github.com/Azure/acr/issues/217#issuecomment-490372387
  const imageMetadata =
    statusCode === 200
      ? body
      : statusCode === 307
      ? (await client.get(headers.location)).body
      : null;

  if (!imageMetadata) {
    log.debug("No image metadata found!");
    return;
  }

  return {
    labels: imageMetadata.config.Labels,
    env: imageMetadata.config.Env,
    digest: manifest.config.digest
  };
}
