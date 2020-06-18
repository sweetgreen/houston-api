import { deploymentFragment, workspaceFragment } from "./fragment";
import { validateReleaseName, generateReleaseName } from "deployments/naming";
import {
  defaultAirflowImage,
  mapPropertiesToDeployment,
  generateDefaultDeploymentConfig
} from "deployments/config";
import validate from "deployments/validate";
import { track } from "analytics";
import { WorkspaceSuspendedError, TrialError } from "errors";
import { addFragmentToInfo } from "graphql-binding";
import config from "config";
import { get, isNull, find, size, merge, isEmpty } from "lodash";
import nats from "node-nats-streaming";
import {
  AIRFLOW_EXECUTOR_DEFAULT,
  DEPLOYMENT_CREATED,
  DEPLOYMENT_PROPERTY_EXTRA_AU
} from "constants";

// Create NATS client.
const nc = nats.connect("test-cluster", "create-deployment");

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
  const executor = get(args, "config.executor", AIRFLOW_EXECUTOR_DEFAULT);
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

  // Send event that a new deployment was created.
  // An async worker will pick this job up and ensure
  // the changes are propagated.
  nc.publish(DEPLOYMENT_CREATED, deployment.id);

  // Return the deployment.
  return deployment;
}
