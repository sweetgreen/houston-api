import adjectives from "./adjectives";
import nouns from "./nouns";
import { objectToArrayOfKeyValue } from "deployments/config";
import { InvalidReleaseName, InvalidReleaseNameLength } from "errors";
import { snakeCase } from "lodash";
import config from "config";
import Haikunator from "haikunator";

/**
 * Validate manual release name input
 * @param {String} name to validate with namespace
 * @return {String} The release name.
 */
export function validateReleaseName(name) {
  const maxCharLen = 63;
  // Test string pattern
  const pattern = /^(?![0-9]+$)(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63}$/g;
  if (!pattern.test(name)) throw new InvalidReleaseName();

  // Reserved repository in docker registry for base airflow images
  if (name === "base-images")
    throw new InvalidReleaseName("base-images is reserved name");

  // Test total char length
  const prefix = config.get("helm.releaseNamespace");

  if (prefix.length + name.length > maxCharLen) {
    throw new InvalidReleaseNameLength(
      `${prefix}-${name} exceeds max char limit of ${maxCharLen}.`
    );
  }

  // Return releaseName if all good
  return name;
}

/**
 * Generate a release name using the adjectives and nouns in this package.
 * @param {Integer} tokenLength Amount of digits to append.
 * @return {String} The release name.
 */
export function generateReleaseName(tokenLength = 4) {
  const haikunator = new Haikunator({ adjectives, nouns });
  return haikunator.haikunate({ tokenLength }).replace(/_/g, "-");
}

/**
 * Generate a namespace from the given release name.
 * @param {String} name a release name.
 * @return {String} The namespace name
 */
export function generateNamespace(name) {
  const { releaseNamespace, singleNamespace } = config.get("helm");
  return singleNamespace ? releaseNamespace : `${releaseNamespace}-${name}`;
}

/**
 * Return an empty array if single namespace mode,
 * otherwise return the labels from the config file
 * @param {Object} platform Platform information {"release", "workspace"}
 * @return array of objects in the form {"key": ****, "value": ***}
 */
export function generateDeploymentLabels(platform = {}) {
  const { singleNamespace } = config.get("helm");
  const { namespaceLabels } = config.get("deployments");

  const objectOfKeys = {
    ...(singleNamespace ? {} : namespaceLabels),
    ...platform
  };

  return objectToArrayOfKeyValue(objectOfKeys);
}

/**
 * Generate the name for environment secret.
 * @param {String} name a release name.
 * @return {String} The secret name.
 */
export function generateEnvironmentSecretName(name) {
  return `${name}-env`;
}

/**
 * Generate the database name for a release.
 * @param {String} name of a release.
 * @return {String} The database name.
 */
export function generateDatabaseName(name) {
  return `${snakeCase(name)}_airflow`;
}

/**
 * Generate the airflow user name for a release.
 * @param {String} name of a release.
 * @return {String} The user name.
 */
export function generateAirflowUsername(name) {
  return `${snakeCase(name)}_airflow`;
}

/**
 * Generate the celery user name for a release.
 * @param {String} name of a release.
 * @return {String} The user name.
 */
export function generateCeleryUsername(name) {
  return `${snakeCase(name)}_celery`;
}
