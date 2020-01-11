import log from "logger";
import { createDockerJWT } from "registry/jwt";
import { prisma } from "generated/client";
import { extractImageMetadata } from "routes/v1/registry/events/post";
import request from "request-promise-native";
import config from "config";
import { map, size } from "lodash";
import { DEPLOYMENT_AIRFLOW } from "constants";
import { execSync } from "child_process";

export async function up() {
  log.info(`Migrating docker images from registry to database`);

  // Since we are using the prisma client library and we run `prisma generate`
  // before these migrations, the query below will fail, looking for new columns against
  // an unmigrated database.
  log.debug("Running prisma-deploy");
  execSync("node_modules/.bin/prisma deploy --force", { stdio: "inherit" });

  // Query for all deployments in the system.
  const deployments = await prisma.deployments({}, `{ releaseName }`);

  // Grab some configuration.
  const { host, port } = config.get("registry");

  const deploymentCount = size(deployments);

  // Log deployment info if we have some to expire
  if (deploymentCount > 0) {
    const names = map(deployments, "releaseName").join(", ");
    log.info(`Found ${size(deployments)} deployments to migrate: ${names}`);
  } else {
    // Return early if we have no deployments.
    log.info("No deployments to migrate, exiting now");
    return;
  }

  // Skip for local env without docker registry
  try {
    for (const deployment of deployments) {
      log.debug(`Migrating ${deployment.releaseName}...`);
      const releaseName = deployment.releaseName;
      const repo = `${releaseName}/${DEPLOYMENT_AIRFLOW}`;
      const registry = `${host}:${port}`;

      // Create a JWT for the registry request.
      const dockerJWT = await createDockerJWT("houston", [
        {
          type: "repository",
          // Build the repo name.
          name: repo,
          actions: ["pull"]
        }
      ]);

      // Build the registry request URL.
      const uri = `http://${registry}/v2/${repo}/tags/list`;
      log.debug(`Requesting docker tags for ${releaseName} at ${uri}`);

      const { tags } = await request({
        method: "GET",
        uri,
        json: true,
        headers: { Authorization: `Bearer ${dockerJWT}` }
      });

      if (!tags) {
        log.info("There is no tags :(");
        continue;
      }

      for (const tag of tags) {
        // For each tag create record
        const ev = {
          target: {
            url: `http://${registry}/v2/${repo}/manifests/${tag}`,
            repository: repo,
            mediaType: "application/vnd.docker.distribution.manifest.v2+json"
          }
        };
        const imageMetadata = await extractImageMetadata(ev);
        try {
          await prisma.createDockerImage({
            name: `${repo}:${tag}`,
            deployment: {
              connect: { releaseName }
            },
            labels: imageMetadata.labels,
            env: imageMetadata.env,
            tag: tag,
            digest: imageMetadata.digest
          });
        } catch (error) {
          log.error(`Error during create docker image: ${error}`);
        }
      }
    }
  } catch (e) {
    log.error(e);
  }
}

export async function down() {}
