import { InvalidDeploymentError } from "errors";
import { intersection, map } from "lodash";

// List of environment variables that we override in helm.
// We prevent users from setting these.
const list = [
  "AIRFLOW__CORE__EXECUTOR",
  "AIRFLOW__CORE__SQL_ALCHEMY_CONN",
  "AIRFLOW__CORE__LOAD_EXAMPLES",
  "AIRFLOW__CORE__FERNET_KEY",
  "AIRFLOW__WEBSERVER__BASE_URL",
  "AIRFLOW__CELERY__BROKER_URL",
  "AIRFLOW__CELERY__RESULT_BACKEND",
  "AIRFLOW__CELERY__DEFAULT_QUEUE",
  "AIRFLOW__SCHEDULER__SCHEDULER_HEARTBEAT_SEC",
  "AIRFLOW__SCHEDULER__STATSD_ON",
  "AIRFLOW__SCHEDULER__STATSD_HOST",
  "AIRFLOW__SCHEDULER__STATSD_PORT",
  "AIRFLOW__SCHEDULER__STATSD_PREFIX",
  "AIRFLOW__KUBERNETES__NAMESPACE"
];

export default function validateEnvironment(envs) {
  validateHelmOverrides(envs);
  validateEnvironmentVariables(envs);
}

/*
 * Validate that the deployment environment variables are not a part of the Helm Overrides.
 * Throws if any reserved Helm key is found.
 * @param {[]Object} An array of environment variable key/value pairs
 */
function validateHelmOverrides(envs) {
  const i = intersection(
    list,
    map(envs, v => v.key.toUpperCase())
  );
  if (i.length > 0) {
    const s = [i.slice(0, -1).join(", "), i.slice(-1)[0]].join(
      i.length < 2 ? "" : " and "
    );
    const msg = `${s} ${
      i.length > 1 ? "are" : "is"
    } set automatically and cannot be overridden`;
    throw new InvalidDeploymentError(msg);
  }
}
/*
 * Validate format of the key for deployment env vars. Throws if the format is invalid.
 * @param {[]Object} An array of environment variable key/value pairs
 */
function validateEnvironmentVariables(envs) {
  const matcher = /^(?!_+$)^(?=^[A-Z_])([A-Z0-9_]+$)/g;
  envs &&
    envs.forEach(pair => {
      const key = pair.key;
      const invalid = key.match(matcher) === null;

      if (invalid) {
        const msg = `Invalid Environment Variable Key: ${key} (use alphanumeric and underscores)`;
        throw new InvalidDeploymentError(msg);
      }
    });
}
