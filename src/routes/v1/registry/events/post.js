import { generateHelmValues } from "deployments/config";
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
import { DEPLOYMENT_AIRFLOW, MEDIATYPE_DOCKER_MANIFEST_V2 } from "constants";

/*
 * Handle webhooks from the docker registry.
 * @param {Object} req The request.
 * @param {Object} res The response.
 */
export default async function(req, res) {
  const { events = [] } = req.body;

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

      // Get the existing config for this deployment.
      const config = await prisma.deployment({ releaseName }).config();

      if (!config) return;

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
          data: { config: updatedConfig }
        })
        .$fragment(
          `{ id config label releaseName extraAu version workspace { id } }`
        );

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

      // Run the analytics track event
      track(get(ev, "actor.name"), "Deployed Code", {
        deploymentId: updatedDeployment.id,
        label: updatedDeployment.label,
        releaseName,
        tag
      });
    })
  );

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
