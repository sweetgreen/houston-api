/*
 * Script check platform updates
 */
import "dotenv/config";
import log from "logger";
import { prisma } from "generated/client";
import { version } from "utilities";
import request from "request-promise-native";
import { size } from "lodash";
import yargs from "yargs";

export async function getPlatformReleases(uri) {
  let versions;
  log.debug(`Fetching platform updates from ${uri}`);
  try {
    const response = await request({
      method: "GET",
      headers: { "User-Agent": `houston/${version()}` },
      uri,
      json: true
    });
    versions = response.available_releases;
  } catch (e) {
    log.error(e);
  }

  // Exit early if we have no versions.
  if (size(versions) === 0) {
    log.info("There are no versions to update");
    return;
  }
  return versions;
}

export async function updatePlatformReleases(uri) {
  log.info("Starting update platform versions");
  // Build the deployment query.
  const newReleases = await getPlatformReleases(uri);

  // Exit early if we have no versions.
  if (size(newReleases) === 0) {
    log.info("There are no new releases to update");
    return;
  }

  // Loop through the new release from updates service and current db
  for (const newRelease of newReleases) {
    log.info(`Checking possible new release version ${newRelease.version}`);
    // Create new release in db
    await prisma.upsertPlatformRelease({
      where: { version: newRelease.version },
      create: {
        version: newRelease.version,
        url: newRelease.url,
        releaseDate: newRelease.release_date,
        level: newRelease.level,
        description: newRelease.description
      },
      update: {
        url: newRelease.url,
        releaseDate: newRelease.release_date,
        level: newRelease.level,
        description: newRelease.description
      }
    });
  }
}

const argv = yargs
  .option("update-service-url", {
    alias: "url",
    default: "https://updates.astronomer.io/astronomer-platform",
    description: "Check and store platform release versions",
    type: "string"
  })
  .help()
  .alias("help", "h").argv;

// When a file is run directly from Node, require.main is set to its module.
if (require.main === module) {
  updatePlatformReleases(argv["update-service-url"]).catch(e => {
    log.error(e);
  });
}
