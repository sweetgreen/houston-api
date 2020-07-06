import { queryFragment, responseFragment } from "./fragments";
import { track } from "analytics";
import validate from "deployments/validate";
import {
  generateHelmValues,
  mapPropertiesToDeployment
} from "deployments/config";
import { generateNamespace } from "deployments/naming";
import { TrialError } from "errors";
import config from "config";
import { addFragmentToInfo } from "graphql-binding";
import { get, isEmpty, merge, pick } from "lodash";
import { DEPLOYMENT_AIRFLOW } from "constants";

/*
 * Update a deployment.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Deployment} The updated Deployment.
 */
export default async function updateDeployment(parent, args, ctx, info) {
  // Get the deployment first.
  const deployment = await ctx.db.query.deployment(
    { where: { id: args.deploymentUuid } },
    queryFragment
  );

  // Block config changes if the user is in a trial
  const stripeEnabled = config.get("stripe.enabled");
  if (!deployment.workspace.stripeCustomerId && stripeEnabled) {
    throw new TrialError();
  }

  // This should be directly defined in the schema, rather than nested
  // under payload as JSON. This is only here until we can migrate the
  // schema of this mutation. The UI should also not send non-updatable
  // properties up in the payload.
  // Until we fix these, pick out the args we allow updating on.
  const updatablePayload = pick(args.payload, [
    "label",
    "description",
    "version"
  ]);

  const serviceAccountAnnotations = {};

  const serviceAccountAnnotationKey = config.get(
    "deployments.serviceAccountAnnotationKey"
  );

  const originalConfig = get(deployment, "config", {});

  // Generate the service account annotations.
  if (args.cloudRole && serviceAccountAnnotationKey) {
    serviceAccountAnnotations[serviceAccountAnnotationKey] = args.cloudRole;
  }

  const deploymentConfig = merge(
    {},
    // Get current serviceAccountAnnotations
    originalConfig,
    args.config,
    // Store serviceAccount annotations only we have value in it
    !isEmpty(serviceAccountAnnotations) && { serviceAccountAnnotations }
  );

  // Munge the args together to resemble the createDeployment mutation.
  // Once we fix the updateDeployment schema to match, we can skip this.
  const mungedArgs = merge({}, updatablePayload, {
    config: deploymentConfig,
    properties: get(args, "payload.properties", {})
  });

  // Validate our args.
  await validate(deployment.workspace.id, mungedArgs, deployment);

  // Create the update statement.
  const where = { id: args.deploymentUuid };
  const data = merge({}, updatablePayload, {
    config: mungedArgs.config,
    ...mapPropertiesToDeployment(mungedArgs.properties)
  });

  // Update the deployment in the database.
  const updatedDeployment = await ctx.db.mutation.updateDeployment(
    { where, data },
    addFragmentToInfo(info, responseFragment)
  );

  // If we're syncing to kubernetes, fire updates to commander.
  if (args.sync) {
    // Update the deployment
    await ctx.commander.request("updateDeployment", {
      releaseName: updatedDeployment.releaseName,
      chart: {
        name: DEPLOYMENT_AIRFLOW,
        version: updatedDeployment.version
      },
      namespace: generateNamespace(updatedDeployment.releaseName),
      rawConfig: JSON.stringify(generateHelmValues(updatedDeployment))
    });
  }

  // Run the analytics track event
  track(ctx.user.id, "Updated Deployment", {
    deploymentId: args.deploymentUuid,
    config: args.config,
    payload: args.payload
  });

  // Return the updated deployment object.
  return updatedDeployment;
}
