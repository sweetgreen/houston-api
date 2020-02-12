import fragment from "./fragment";
import log from "logger";
import { addFragmentToInfo } from "graphql-binding";
import config from "config";
import { size, first } from "lodash";
import semver from "semver";
/*
 * Check if there is a new platform release available.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {PlatformRelease} PlatformRelease.
 */
export default async function updateAvailable(parent, args, ctx, info) {
  // Get current helm release version
  const currentVersion = config.get("helm.releaseVersion");

  // Get all available versions from database
  const platformReleases = await ctx.db.query.platformReleases(
    {},
    addFragmentToInfo(info, fragment)
  );

  if (size(platformReleases) === 0) {
    log.info("There are no platform releases in the database");
    return;
  }

  // Get maximum available release version of platform
  const maxRelease = first(
    platformReleases.sort((left, right) =>
      semver.rcompare(left.version, right.version)
    )
  );

  // Return only new release version
  if (semver.gt(maxRelease.version, currentVersion)) {
    return maxRelease;
  }
}
