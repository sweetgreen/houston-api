import providers from "../providers";
import { InvalidAuthenticationProviderError } from "errors";
import config from "config";
import { get, has, trim } from "lodash";

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
 * Return full orbit scheme/host.
 * @return {String} The orbit url.
 */
export function orbit() {
  const baseDomain = config.get("helm.baseDomain");
  const { subdomain, port } = config.get("orbit");
  return `${scheme()}://${subdomain}.${baseDomain}:${port}`;
}

/*
 * Return full houston scheme/host.
 * @return {String} The houston url.
 */
export function houston() {
  const baseDomain = config.get("helm.baseDomain");
  const port = config.get("webserver.port");
  const subdomain = config.get("subdomain");
  return `${scheme()}://${subdomain}.${baseDomain}:${port}`;
}

/*
 * Return full oauth url.
 * @return {String} The oauth url.
 */
export function oauthUrl() {
  return `${houston()}/${version()}/oauth`;
}

/*
 * Return full oauth redirect url.
 * @return {String} The oauth redirect url.
 */
export function oauthRedirectUrl() {
  return `${houston()}/${version()}/oauth_redirect`;
}

/*
 * Return if an oauth module is enabled.
 * @param {String} The provider name.
 * @return {Boolean} Module enabled.
 */
export function providerEnabled(name) {
  return has(providers, name);
}

/*
 * Return oauth module based on provider string
 * @param {String} The provider name.
 * @return {Object} The provider module.
 */
export function getProvider(name) {
  if (providerEnabled(name)) return get(providers, name);
  else throw new InvalidAuthenticationProviderError();
}
