import config from "config";

/*
 * Get information about how app is configured for the cluster.
 */
export default async function appConfig() {
  return {
    version: config.get("helm.releaseVersion"),
    baseDomain: config.get("helm.baseDomain"),
    smtpConfigured: config.get("email.enabled") && !!config.get("email.smtpUrl")
  };
}
