export const DEPLOYMENT_AIRFLOW = "airflow";

export const DEPLOYMENT_PROPERTY_COMPONENT_VERSION = "component_version";
export const DEPLOYMENT_PROPERTY_ALERT_EMAILS = "alert_emails";
export const DEPLOYMENT_PROPERTY_EXTRA_AU = "extra_au";

export const DEPLOYMENT_STATUS_ACTIVE = "active";
export const DEPLOYMENT_STATUS_DELETING = "deleting";

export const AIRFLOW_EXECUTOR_LOCAL = "LocalExecutor";
export const AIRFLOW_EXECUTOR_CELERY = "CeleryExecutor";
export const AIRFLOW_EXECUTOR_KUBERNETES = "KubernetesExecutor";

// Set the default executor
export const AIRFLOW_EXECUTOR_DEFAULT = AIRFLOW_EXECUTOR_CELERY;

export const AIRFLOW_COMPONENT_SCHEDULER = "scheduler";
export const AIRFLOW_COMPONENT_WEBSERVER = "webserver";
export const AIRFLOW_COMPONENT_STATSD = "statsd";
export const AIRFLOW_COMPONENT_PGBOUNCER = "pgbouncer";
export const AIRFLOW_COMPONENT_WORKERS = "workers";
export const AIRFLOW_COMPONENT_FLOWER = "flower";
export const AIRFLOW_COMPONENT_REDIS = "redis";

export const USER_STATUS_ACTIVE = "active";
export const USER_STATUS_PENDING = "pending";
export const USER_STATUS_BANNED = "banned";
export const USER_STATUS_INACTIVE = "inactive";

export const USER_PROPERTY_FULL_NAME = "fullName";
export const USER_PROPERTY_AVATAR_URL = "avatarUrl";
export const USER_PROPERTY_CATEGORY_PROFILE = "profile";

export const SYSTEM_ADMIN = "SYSTEM_ADMIN";
export const SYSTEM_EDITOR = "SYSTEM_EDITOR";
export const SYSTEM_VIEWER = "SYSTEM_VIEWER";
export const WORKSPACE_ADMIN = "WORKSPACE_ADMIN";
export const WORKSPACE_EDITOR = "WORKSPACE_EDITOR";
export const WORKSPACE_VIEWER = "WORKSPACE_VIEWER";
export const DEPLOYMENT_ADMIN = "DEPLOYMENT_ADMIN";
export const DEPLOYMENT_EDITOR = "DEPLOYMENT_EDITOR";
export const DEPLOYMENT_VIEWER = "DEPLOYMENT_VIEWER";

export const ENTITY_WORKSPACE = "WORKSPACE";
export const ENTITY_DEPLOYMENT = "DEPLOYMENT";

export const INVITE_SOURCE_WORKSPACE = "WORKSPACE";
export const INVITE_SOURCE_SYSTEM = "SYSTEM";

export const DOCKER_REGISTRY_CONTENT_TYPE =
  "application/vnd.docker.distribution.events.v1+json";

export const MEDIATYPE_DOCKER_MANIFEST_V2 =
  "application/vnd.docker.distribution.manifest.v2+json";

export const RELEASE_NAME_PATTERN = /^(?![0-9]+$)(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63}$/;
export const RELEASE_NAME_AIRFLOW_PATTERN = /^\/((?![0-9]+$)(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63})\/(airflow|flower)/;
export const VALID_DOCKER_IMAGE_NAME = /^(?<releaseName>(?![0-9]+$)(?!.*-$)(?!-)[a-zA-Z0-9-]{1,63})\/airflow$/;

// NATS related constants

export const DEPLOYMENT_IMAGE_UPDATED = "houston.deployment.image.updated";
export const DEPLOYMENT_IMAGE_UPDATED_ID =
  "houston-deployment-image-updated-worker";
export const DEPLOYMENT_IMAGE_UPDATE_DEPLOYED = `${DEPLOYMENT_IMAGE_UPDATED}.deployed`;

export const DEPLOYMENT_CREATED = "houston.deployment.created";
export const DEPLOYMENT_CREATED_ID = "houston-deployment-created-worker";
export const DEPLOYMENT_CREATED_STARTED = `${DEPLOYMENT_CREATED}.started`;
export const DEPLOYMENT_CREATED_DEPLOYED = `${DEPLOYMENT_CREATED}.deployed`;

export const DEPLOYMENT_UPDATED = "houston.deployment.updated";
export const DEPLOYMENT_UPDATED_ID = "houston-deployment-updated-worker";

export const DEPLOYMENT_DELETED = "houston.deployment.deleted";
export const DEPLOYMENT_DELETED_ID = "houston-deployment-deleted-worker";
export const DEPLOYMENT_DELETED_STARTED = `${DEPLOYMENT_DELETED}.started`;
export const DEPLOYMENT_DELETED_DEPLOYED = `${DEPLOYMENT_DELETED}.deployed`;

export const DEPLOYMENT_VARS_UPDATED = "houston.deployment.variables.updated";
export const DEPLOYMENT_VARS_UPDATED_ID =
  "houston-deployment-variables-updated-worker";
export const DEPLOYMENT_VARS_UPDATED_DEPLOYED = `${DEPLOYMENT_VARS_UPDATED}.deployed`;
