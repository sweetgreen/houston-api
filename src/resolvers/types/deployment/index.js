import { hasPermission } from "rbac";
import {
  mapDeploymentToProperties,
  findLatestTag,
  generateNextTag
} from "deployments/config";
import { extractVariables } from "deployments/environment-variables";
import getDeploymentServiceAccounts from "deployment-service-accounts";
import { first, map } from "lodash";
import config from "config";
import {
  AIRFLOW_EXECUTOR_CELERY,
  DEPLOYMENT_AIRFLOW,
  ENTITY_DEPLOYMENT
} from "constants";

/*
 * Return a list of important urls for this deployment.
 * @param {Object} parent The result of the parent resolver.
 * @param {[]Object} The list of urls.
 */
export function urls(parent) {
  const { config: cfg, releaseName } = parent;
  const baseDomain = config.get("helm.baseDomain");

  // All deployments will have the airflow url.
  const urls = [
    {
      type: `airflow`,
      url: `https://deployments.${baseDomain}/${releaseName}/airflow`
    }
  ];

  // Celery deployments will also have flower url.
  if (cfg.executor === AIRFLOW_EXECUTOR_CELERY) {
    urls.push({
      type: `flower`,
      url: `https://deployments.${baseDomain}/${releaseName}/flower`
    });
  }

  return urls;
}

/*
 * Return a properly formatted list of environment variables.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {[]Object} The environment variables.
 */
export async function environmentVariables(parent, args, ctx) {
  return extractVariables(parent, { releaseName: parent.releaseName }, ctx);
}

/*
 * Return a properly formatted properties object.
 * @param {Object} parent The result of the parent resolver.
 * @return {Object} The legacy properties object.
 */
export async function properties(parent) {
  return mapDeploymentToProperties(parent);
}

/*
 * Return the default type.
 * @return {String} The deployment type.
 */
export function type() {
  return DEPLOYMENT_AIRFLOW;
}

/*
 * Return information about the deployment images.
 * @param {Object} parent The result of the parent resolver.
 * @return {Object} The deployment info.
 */
export async function deployInfo(parent, args, ctx) {
  const prefix = config.get("deployments.tagPrefix");
  const images = await ctx.db.query.dockerImages(
    {
      where: { deployment: { id: parent.id }, tag_starts_with: `${prefix}-` }
    },
    `{ tag }`
  );
  const tags = map(images, "tag");
  const latest = findLatestTag(tags);
  const nextCli = generateNextTag(latest);

  const imagesCreated = await ctx.db.query.dockerImages(
    {
      where: { deployment: { id: parent.id } },
      orderBy: "createdAt_DESC",
      first: 1
    },
    `{ tag }`
  );

  const current = first(map(imagesCreated, "tag"));
  return { latest, nextCli, current };
}

/*
 * Return boolean flags indicating what the current user has access to
 * on a particular deployment.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {DeploymentCapabilities} Map of boolean capabilities.
 */
export function deploymentCapabilities(parent, args, ctx) {
  const permissions = [
    {
      key: "canDeploy",
      value: "deployment.images.push"
    },
    {
      key: "canUpdateDeployment",
      value: "deployment.config.update"
    },
    {
      key: "canDeleteDeployment",
      value: "deployment.config.delete"
    },
    {
      key: "canCreateServiceAccount",
      value: "deployment.serviceAccounts.create"
    },
    {
      key: "canUpdateServiceAccount",
      value: "deployment.serviceAccounts.update"
    },
    {
      key: "canDeleteServiceAccount",
      value: "deployment.serviceAccounts.delete"
    }
  ];

  const capabilities = [];
  permissions.map(p => {
    capabilities[p.key] = hasPermission(
      ctx.user,
      p.value,
      ENTITY_DEPLOYMENT.toLowerCase(),
      parent.id
    );
  });

  return capabilities;
}

/*
 * Return a properly formatted list of service accounts.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @param {Object} info The graphql info.
 * @return {[]Object} The service accounts.
 */
export async function serviceAccounts(parent, args, ctx, info) {
  return getDeploymentServiceAccounts(parent.id, ctx, info);
}

export default {
  urls,
  environmentVariables,
  type,
  properties,
  deployInfo,
  deploymentCapabilities,
  serviceAccounts
};
