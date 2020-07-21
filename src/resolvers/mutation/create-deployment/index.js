import { deploymentFragment, workspaceFragment } from "./fragment";
import {
  validateReleaseName,
  generateReleaseName,
  generateNamespace,
  generateDeploymentLabels
} from "deployments/naming";
import { createDatabaseForDeployment } from "deployments/database";
import {
  defaultAirflowImage,
  generateHelmValues,
  mapPropertiesToDeployment,
  generateDefaultDeploymentConfig,
  generateDeploymentConfig
} from "deployments/config";
import validate from "deployments/validate";
import { track } from "analytics";
import { WorkspaceSuspendedError, TrialError } from "errors";
import { addFragmentToInfo } from "graphql-binding";
import config from "config";
import bcrypt from "bcryptjs";
import { get, isNull, find, size, merge, isEmpty } from "lodash";
import { generate as generatePassword } from "generate-password";
import {
  DEPLOYMENT_AIRFLOW,
  DEPLOYMENT_PROPERTY_EXTRA_AU,
  AIRFLOW_EXECUTOR_DEFAULT
} from "constants";

/*
 * Create a deployment.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Deployment} The newly created Deployment.
 */
export default async function createDeployment(parent, args, ctx, info) {
  // Grab default chart
  const defaultChartVersion = config.get("deployments.chart.version");
  const defaultAirflowVersion = defaultAirflowImage().version;

  // Get executor config
  const { executors } = config.get("deployments");
  const executor = get(args, "executor", AIRFLOW_EXECUTOR_DEFAULT);
  const executorConfig = find(executors, ["name", executor]);

  const where = { id: args.workspaceUuid };
  const workspace = await ctx.db.query.workspace({ where }, workspaceFragment);

  // Is stripe enabled for the system.
  const stripeEnabled = config.get("stripe.enabled");

  // Find deployments that have not yet been soft deleted
  const existingDeployments = find(workspace.deployments, dep =>
    isNull(dep.deletedAt)
  );

  // Throw an error if stripe is enabled (Cloud only) and a stripeCustomerId
  // does not exist in the Workspace table

  if (
    !workspace.stripeCustomerId &&
    stripeEnabled &&
    size(existingDeployments) > 0
  ) {
    throw new TrialError();
  }

  // Throw error if workspace is suspended.
  if (workspace.isSuspended && stripeEnabled) {
    throw new WorkspaceSuspendedError();
  }

  // Validate deployment args.
  await validate(args.workspaceUuid, args);

  // Parse args for default versions, falling back to platform versions.
  const version = get(args, "version", defaultChartVersion);
  const airflowVersion = get(args, "airflowVersion", defaultAirflowVersion);

  // Generate a unique registry password for this deployment.
  const registryPassword = generatePassword({ length: 32, numbers: true });
  const hashedRegistryPassword = await bcrypt.hash(registryPassword, 10);

  // Generate a unique elasticsearch password for this deployment
  const elasticsearchPassword = generatePassword({ length: 32, numbers: true });
  const hashedElasticsearchPassword = await bcrypt.hash(
    elasticsearchPassword,
    10
  );

  // Generate a random fernetKey and base64 encode it for this deployment.
  const fernetKey = new Buffer(
    generatePassword({ length: 32, numbers: true })
  ).toString("base64");

  // Set release name - either randomly generated or manually
  const isManualNamespace =
    config.get("deployments.manualReleaseNames") && args.releaseName;
  const releaseName = isManualNamespace
    ? validateReleaseName(args.releaseName)
    : generateReleaseName();

  // Add default props if exists
  const properties = {
    [DEPLOYMENT_PROPERTY_EXTRA_AU]: executorConfig.defaultExtraAu || 0,
    ...args.properties
  };

  const serviceAccountAnnotations = {};

  const serviceAccountAnnotationKey = config.get(
    "deployments.serviceAccountAnnotationKey"
  );

  // Generate the service account annotations.
  if (args.cloudRole && serviceAccountAnnotationKey) {
    serviceAccountAnnotations[serviceAccountAnnotationKey] = args.cloudRole;
  }

  args.config = await generateDeploymentConfig(args);

  const deploymentConfig = merge(
    {},
    args.config || generateDefaultDeploymentConfig(),
    // Store serviceAccount annotations only we have value in it
    !isEmpty(serviceAccountAnnotations) && { serviceAccountAnnotations }
  );

  // Create the base mutation.
  const mutation = {
    data: {
      label: args.label,
      description: args.description,
      config: deploymentConfig,
      version,
      airflowVersion,
      releaseName,
      registryPassword: hashedRegistryPassword,
      elasticsearchPassword: hashedElasticsearchPassword,
      ...mapPropertiesToDeployment(properties),
      workspace: {
        connect: {
          id: args.workspaceUuid
        }
      }
    }
  };

  // Run the mutation.
  const deployment = await ctx.db.mutation.createDeployment(
    mutation,
    addFragmentToInfo(info, deploymentFragment)
  );

  // Run the analytics track event
  track(ctx.user.id, "Created Deployment", {
    deploymentId: deployment.id,
    label: args.label,
    description: args.description,
    releaseName,
    createdAt: deployment.createdAt,
    config: args.config
  });

  // Create the role binding for the user.
  // XXX: This was commented out temporarily while we are
  // synthetically generating DEPLOYMENT_* RoleBindings.
  // await ctx.db.mutation.createRoleBinding(
  //   {
  //     data: {
  //       role: DEPLOYMENT_ADMIN,
  //       user: { connect: { id: ctx.user.id } },
  //       deployment: { connect: { id: deployment.id } }
  //     }
  //   },
  //   `{ id }`
  // );

  // Create the database for this deployment.
  const {
    metadataConnection,
    resultBackendConnection
  } = await createDatabaseForDeployment(deployment);

  // Create some ad-hoc values to get passed into helm.
  // These won't be changing so just pass them in on create,
  // and subsequent helm upgrades will use the --reuse-values option.
  const data = { metadataConnection, resultBackendConnection };
  const registry = { connection: { pass: registryPassword } };
  const elasticsearch = { connection: { pass: elasticsearchPassword } };

  // Combine values together for helm input.
  const values = {
    data,
    registry,
    elasticsearch,
    fernetKey
  };

  // Generate the helm input for the airflow chart (eg: values.yaml).
  const helmConfig = generateHelmValues(deployment, values);

  // Fire off createDeployment to commander.
  await ctx.commander.request("createDeployment", {
    releaseName: releaseName,
    chart: {
      name: DEPLOYMENT_AIRFLOW,
      version: version
    },
    namespace: generateNamespace(releaseName),
    namespaceLabels: generateDeploymentLabels(helmConfig.labels),
    rawConfig: JSON.stringify(helmConfig)
  });

  // Return the deployment.
  return deployment;
}
