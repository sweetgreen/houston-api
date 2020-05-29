import { track } from "analytics";
import validate from "deployments/validate";
import {
  arrayOfKeyValueToObject,
  generateHelmValues,
  mapPropertiesToDeployment,
  mapCustomEnvironmentVariables
} from "deployments/config";
import {
  generateEnvironmentSecretName,
  generateNamespace
} from "deployments/naming";
import { TrialError } from "errors";
import config from "config";
import { get, isEmpty, merge, pick } from "lodash";
import crypto from "crypto";
import { DEPLOYMENT_AIRFLOW } from "constants";

/*
 * Update a deployment.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {Deployment} The updated Deployment.
 */
export default async function updateDeployment(parent, args, ctx) {
  // Get the deployment first.
  const deployment = await ctx.prisma.deployment.findOne({
    where: { id: args.deploymentUuid },
    include: { workspace: true }
  });

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
    env: args.env,
    properties: get(args, "payload.properties", {})
  });

  // Validate our args.
  await validate(ctx.prisma, deployment.workspace.id, mungedArgs, deployment);

  // Create the update statement.
  const where = { id: args.deploymentUuid };
  const data = merge({}, updatablePayload, {
    config: JSON.stringify(mungedArgs.config),
    ...mapPropertiesToDeployment(mungedArgs.properties)
  });

  // Update the deployment in the database.
  const updatedDeployment = await ctx.prisma.deployment.update({
    where,
    data,
    include: { workspace: true }
  });

  // If we're syncing to kubernetes, fire updates to commander.
  if (args.sync) {
    // Set any environment variables.
    await ctx.commander.request("setSecret", {
      releaseName: updatedDeployment.releaseName,
      namespace: generateNamespace(updatedDeployment.releaseName),
      secret: {
        name: generateEnvironmentSecretName(updatedDeployment.releaseName),
        data: arrayOfKeyValueToObject(args.env)
      }
    });

    // Map the user input env vars to a format that the helm chart expects.
    const values = mapCustomEnvironmentVariables(updatedDeployment, args.env);

    // Add an annotation to Airflow pods to inform pods to restart when
    // secrets have been changed
    const buf = Buffer.from(JSON.stringify(args.env));
    const hash = crypto
      .createHash("sha512")
      .update(buf)
      .digest("hex");

    // This annotation is a sha512 hash of the user-provided Airflow environment variables
    values.airflowPodAnnotations = { "checksum/airflow-secrets": hash };

    // Update the deployment, passing in our custom env vars.
    await ctx.commander.request("updateDeployment", {
      releaseName: updatedDeployment.releaseName,
      chart: {
        name: DEPLOYMENT_AIRFLOW,
        version: updatedDeployment.version
      },
      namespace: generateNamespace(updatedDeployment.releaseName),
      rawConfig: JSON.stringify(generateHelmValues(updatedDeployment, values))
    });
  }

  // Run the analytics track event
  track(ctx.user.id, "Updated Deployment", {
    deploymentId: args.deploymentUuid,
    config: args.config,
    env: args.env,
    payload: args.payload
  });

  // Return the updated deployment object.
  return updatedDeployment;
}
