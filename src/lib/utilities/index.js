import config from "config";
import { snakeCase, trim } from "lodash";

/*
 * Attempt to parse a value as JSON, and either return
 * the parsed JSON object/array, or the primitive if fails.
 * @param {Whatever} thing Thing of any type.
 * @return {JSON/Whatever} Either the valid JSON if it parses
 * successfully, otherwise the originally passed in value.
 */
export function parseJSON(thing) {
  try {
    return JSON.parse(thing);
  } catch {
    return thing;
  }
}

/*
 * Utility function to get the generated cookie name
 * for this cluster.
 * @return {String} The cookie name.
 */
export function getCookieName() {
  const baseDomain = config.get("helm.baseDomain");
  return `astronomer_${snakeCase(baseDomain)}_auth`;
}

/*
 * Return the API version.
 * @return {String} The API version.
 */
export function version() {
  return trim(config.get("webserver.endpoint"), "/");
}

/*
 * Return the URL scheme.
 * @return {String} The URL scheme.
 */
export function scheme() {
  return process.env.NODE_ENV === "production" ? "https" : "http";
}

/*
 * Return full UI scheme/host.
 * @return {String} The UI url.
 */
export function ui() {
  const isProd = process.env.NODE_ENV === "production";
  const baseDomain = config.get("helm.baseDomain");
  const { subdomain, port } = config.get("ui");
  const url = `${scheme()}://${subdomain}.${baseDomain}`;
  return isProd ? url : `${url}:${port}`;
}

/*
 * Return full houston scheme/host.
 * @return {String} The houston url.
 */
export function houston() {
  const isProd = process.env.NODE_ENV === "production";
  const baseDomain = config.get("helm.baseDomain");
  const port = config.get("webserver.port");
  const subdomain = config.get("subdomain");
  const url = `${scheme()}://${subdomain}.${baseDomain}`;
  return isProd ? url : `${url}:${port}`;
}
