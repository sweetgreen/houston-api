import authConfig from "../resolvers/types/auth-config";
import authUser from "../resolvers/types/auth-user";
import deployInfo from "../resolvers/types/deploy-info";
import deployment from "../resolvers/types/deployment";
import invite from "../resolvers/types/invite";
import serviceAccount from "../resolvers/types/service-account";
import user from "../resolvers/types/user";
import workspace from "../resolvers/types/workspace";
import {
  enumType,
  objectType,
  scalarType,
  inputObjectType
} from "@nexus/schema";
import GraphQLJSON, { GraphQLJSONObject } from "graphql-type-json";
import { arg, asNexusMethod } from "nexus";

export const JSONObject = asNexusMethod(GraphQLJSONObject, "jsonObject");
export const JSON = asNexusMethod(GraphQLJSON, "json");

const InviteSearch = inputObjectType({
  name: "InviteSearch",
  definition(t) {
    t.field("inviteUuid", { type: "Uuid", nullable: true });
    t.string("email", { nullable: true });
  }
});

const UserSearch = inputObjectType({
  name: "UserSearch",
  definition(t) {
    t.field("usereUuid", { type: "Uuid", nullable: true });
    t.string("username", { nullable: true });
    t.string("email", { nullable: true });
    t.string("fullName", { nullable: true });
  }
});

export function jsonObjectArg(opts) {
  return arg({ ...opts, type: "JSONObject" });
}

export function jsonArg(opts) {
  return arg({ ...opts, type: "JSON" });
}

const AuthConfig = objectType({
  name: "AuthConfig",
  definition(t) {
    t.boolean("publicSignup", {
      nullable: true,
      resolve: authConfig.publicSignup
    });
    t.string("externalSignupUrl", {
      nullable: true,
      resolve: authConfig.externalSignupUrl
    });
    t.boolean("initialSignup", {
      nullable: true,
      resolve: authConfig.initialSignup
    });
    t.boolean("localEnabled", {
      nullable: true,
      resolve: authConfig.localEnabled
    });
    t.field("providers", {
      type: "AuthProvider",
      list: true,
      resolve: authConfig.providers
    });
  }
});

const AuthUser = objectType({
  name: "AuthUser",
  definition(t) {
    t.field("user", {
      type: "User",
      nullable: true,
      resolve: authUser.user
    });
    t.field("token", {
      type: "Token",
      nullable: true,
      resolve: authUser.token
    });
    t.field("permissions", {
      type: "JSON",
      nullable: true,
      resolve: authUser.permissions
    });
    t.boolean("isAdmin", {
      nullable: true,
      resolve: authUser.isAdmin
    });
    t.field("authUserCapabilities", {
      type: "AuthUserCapabilities",
      nullable: true,
      resolve: authUser.authUserCapabilities
    });
  }
});

const DeployInfo = objectType({
  name: "DeployInfo",
  definition(t) {
    t.string("current", { nullable: true });
    t.string("nextCli", {
      nullable: true,
      resolve: deployInfo.next
    });
  }
});

const Deployment = objectType({
  name: "Deployment",
  definition(t) {
    t.model.id();
    t.field("config", {
      type: "JSON",
      nullable: true
    });
    t.field("env", {
      type: "JSON",
      nullable: true,
      resolve: (root, args, context) => deployment.env(root, args, context)
    });
    t.field("properties", {
      type: "JSON",
      nullable: true,
      resolve: deployment.properties
    });
    t.field("urls", {
      type: "DeploymentUrl",
      list: true,
      nullable: true,
      resolve: deployment.urls
    });
    t.model.alertEmails({ type: "String", list: true });
    t.model.description();
    t.model.label();
    t.model.releaseName();
    t.string("status", { nullable: true });
    t.string("type", { nullable: true, resolve: deployment.type });
    t.model.version();
    t.model.airflowVersion();
    t.field("deployInfo", {
      type: DeployInfo,
      nullable: true,
      resolve: deployment.deployInfo
    });
    t.model.workspace({ nullable: true });
    t.model.createdAt();
    t.model.updatedAt();
    t.model.roleBindings({ pagination: false });
    t.field("deploymentCapabilities", {
      type: "DeploymentCapabilities",
      nullable: true,
      resolve: deployment.deploymentCapabilities
    });
  }
});

const Role = enumType({
  name: "Role",
  members: [
    "SYSTEM_ADMIN",
    "SYSTEM_EDITOR",
    "SYSTEM_VIEWER",
    "WORKSPACE_ADMIN",
    "WORKSPACE_EDITOR",
    "WORKSPACE_VIEWER",
    "DEPLOYMENT_ADMIN",
    "DEPLOYMENT_EDITOR",
    "DEPLOYMENT_VIEWER",
    "USER"
  ]
});

const EntityType = enumType({
  name: "EntityType",
  members: ["WORKSPACE", "DEPLOYMENT", "SYSTEM"]
});

const MetricType = enumType({
  name: "MetricType",
  members: [
    "DEPLOYMENT_STATUS",
    "DEPLOYMENT_TASKS",
    "DEPLOYMENT_DATABASE",
    "DEPLOYMENT_SCHEDULER",
    "DEPLOYMENT_QUOTAS",
    "DEPLOYMENT_USAGE"
  ]
});

const Operator = enumType({
  name: "Operator",
  members: ["AND", "OR"]
});

const Uuid = scalarType({
  name: "Uuid",
  serialize: value => value
});

const AuthUserCapabilities = objectType({
  name: "AuthUserCapabilities",
  definition(t) {
    t.boolean("canSysAdmin", { nullable: true });
  }
});

const AppConfig = objectType({
  name: "AppConfig",
  definition(t) {
    t.string("version", { nullable: true });
    t.string("baseDomain", { nullable: true });
    t.boolean("smtpConfigured", { nullable: true });
    t.boolean("manualReleaseNames", { nullable: true });
  }
});

const AuthProvider = objectType({
  name: "AuthProvider",
  definition(t) {
    t.string("name");
    t.string("displayName", { nullable: true });
    t.string("url");
  }
});

const TokenPayload = objectType({
  name: "TokenPayload",
  definition(t) {
    t.field("uuid", { type: "Uuid", nullable: true });
    t.int("iat", { nullable: true });
    t.int("exp", { nullable: true });
  }
});

const Token = objectType({
  name: "Token",
  definition(t) {
    t.string("value", { nullable: true });
    t.field("payload", { type: TokenPayload, nullable: true });
  }
});

const Invite = objectType({
  name: "Invite",
  definition(t) {
    t.string("id");
    t.string("uuid");
    t.string("assignments");
    t.string("role", { resolve: invite.role });
    t.string("email", { nullable: true });
    t.string("token", { nullable: true });
    t.string("createdAt");
    t.string("updatedAt");
  }
});

const Email = objectType({
  name: "Email",
  definition(t) {
    // TODO: revisit list of fields
    t.model.id();
    t.model.address({ nullable: true });
    t.model.primary({ nullable: true });
    t.model.token({ nullable: true });
    t.model.user({ nullable: true });
    t.model.verified({ nullable: true });
    t.model.createdAt();
    t.model.updatedAt();
  }
});

const LocalCredential = objectType({
  name: "LocalCredential",
  definition(t) {
    t.model.id();
    t.model.user({ nullable: true });
    t.model.password({ nullable: true });
    t.model.resetToken({ nullable: true });
    t.model.createdAt();
    t.model.updatedAt();
  }
});

const RoleBinding = objectType({
  name: "RoleBinding",
  definition(t) {
    t.model.id();
    t.model.role({ nullable: true });
    t.model.user({ nullable: true });
    t.model.serviceAccount({ nullable: true });
    t.model.workspace({ nullable: true });
    t.model.deployment({ nullable: true });
    t.model.createdAt();
  }
});

const ServiceAccount = objectType({
  name: "ServiceAccount",
  definition(t) {
    t.model.id();
    t.model.apiKey({ nullable: true, resolve: serviceAccount.apiKey });
    t.model.label({ nullable: true });
    t.model.category({ nullable: true });
    t.string("entityType", { resolve: serviceAccount.entityType });
    t.field("entityUuid", { type: "Uuid", nullable: true });
    t.field("workspaceUuid", {
      type: "Uuid",
      alias: "entityUuid",
      nullable: true,
      resolve: serviceAccount.entityUuid
    });
    t.field("deploymentUuid", {
      type: "Uuid",
      alias: "entityUuid",
      nullable: true,
      resolve: serviceAccount.entityUuid
    });
    t.model.active({ nullable: true });
    t.model.lastUsedAt({ nullable: true });
    t.model.createdAt();
    t.model.updatedAt();
    t.model.roleBinding();
  }
});

// This only exists to support the legacy API.
const UserProp = objectType({
  name: "UserProp",
  definition(t) {
    t.string("key", { nullable: true });
    t.string("value", { nullable: true });
    t.string("category", { nullable: true });
  }
});

const User = objectType({
  name: "User",
  definition(t) {
    t.model.id();
    t.model.username();
    t.field("emails", { type: "Email", list: true, nullable: true });
    t.model.fullName();
    t.model.status();
    t.field("profile", { type: "UserProp", list: true, resolve: user.profile });
    t.model.createdAt();
    t.model.updatedAt();
    t.model.roleBindings({ pagination: false });
  }
});

const InviteToken = objectType({
  name: "InviteToken",
  definition(t) {
    t.model.id();
    t.model.role();
    t.model.email();
    t.model.token();
    t.model.createdAt();
    t.model.updatedAt();
  }
});

const WorkspaceCapabilities = objectType({
  name: "WorkspaceCapabilities",
  definition(t) {
    t.boolean("canUpdateBilling", { nullable: true });
    t.boolean("canUpdateIAM", { nullable: true });
    t.boolean("canUpdateWorkspace", { nullable: true });
    t.boolean("canDeleteWorkspace", { nullable: true });
    t.boolean("canCreateDeployment", { nullable: true });
    t.boolean("canInviteUser", { nullable: true });
    t.boolean("canUpdateUser", { nullable: true });
    t.boolean("canDeleteUser", { nullable: true });
    t.boolean("canCreateServiceAccount", { nullable: true });
    t.boolean("canUpdateServiceAccount", { nullable: true });
    t.boolean("canDeleteServiceAccount", { nullable: true });
  }
});

const Workspace = objectType({
  name: "Workspace",
  definition(t) {
    t.model.id();
    t.field("deployments", {
      type: "Deployment",
      list: true,
      nullable: true,
      resolve: workspace.deployments
    });
    t.field("uuid", {
      type: "Uuid",
      nullable: true,
      resolve: ({ id }) => id
    });
    t.boolean("active", { nullable: true });
    t.model.description();
    t.field("invites", { type: "Invite", resolve: workspace.invites });
    t.field("properties", { type: "JSON", nullable: true });
    t.model.label();
    t.field("users", {
      type: "User",
      list: true,
      nullable: true,
      resolve: workspace.users
    });
    t.model.stripeCustomerId();
    t.model.roleBindings({ pagination: false });
    t.field("workspaceCapabilities", {
      type: "WorkspaceCapabilities",
      nullable: true,
      resolve: workspace.workspaceCapabilities
    });
    t.model.createdAt();
    t.model.updatedAt();
    t.model.trialEndsAt();
    t.boolean("billingEnabled", {
      nullable: true,
      resolve: workspace.billingEnabled
    });
    t.boolean("paywallEnabled", {
      nullable: true,
      resolve: workspace.paywallEnabled
    });
  }
});

const AstroUnit = objectType({
  name: "AstroUnit",
  definition(t) {
    t.int("cpu");
    t.int("memory");
    t.float("pods");
    t.float("airflowConns");
    t.float("actualConns");
    t.float("price");
  }
});

const AirflowImage = objectType({
  name: "AirflowImage",
  definition(t) {
    t.string("version");
    t.string("channel");
    t.string("tag");
  }
});

const DeploymentConfig = objectType({
  name: "DeploymentConfig",
  definition(t) {
    t.field("defaults", { type: "JSON" });
    t.field("limits", { type: "JSON" });
    t.field("astroUnit", { type: "AstroUnit" });
    t.int("maxExtraAu", { nullable: true });
    t.field("executors", { type: "JSON" });
    t.boolean("singleNamespace");
    t.boolean("loggingEnabled");
    t.string("latestVersion"); // @depricated
    t.field("airflowImages", { type: "AirflowImage", list: true });
    t.field("airflowVersions", { type: "JSON", nullable: true });
    t.string("defaultAirflowImageTag");
    t.string("defaultAirflowChartVersion");
  }
});

const DeploymentUrl = objectType({
  name: "DeploymentUrl",
  definition(t) {
    t.string("type", { nullable: true });
    t.string("url", { nullable: true });
  }
});

const DeploymentCapabilities = objectType({
  name: "DeploymentCapabilities",
  definition(t) {
    t.boolean("canDeploy", { nullable: true });
    t.boolean("canUpdateDeployment", { nullable: true });
    t.boolean("canDeleteDeployment", { nullable: true });
    t.boolean("canCreateServiceAccount", { nullable: true });
    t.boolean("canUpdateServiceAccount", { nullable: true });
    t.boolean("canDeleteServiceAccount", { nullable: true });
  }
});

const DockerImage = objectType({
  name: "DockerImage",
  definition(t) {
    t.model.id();
    t.model.name();
    t.model.labels();
    t.model.env();
    t.model.tag();
    t.model.digest();
    t.model.deployment();
    t.model.createdAt();
  }
});

const PlatformRelease = objectType({
  name: "PlatformRelease",
  definition(t) {
    t.model.id();
    t.model.version();
    t.model.url();
    t.model.description();
    t.model.level();
    t.model.releaseDate();
    t.model.createdAt();
    t.model.updatedAt();
  }
});

const Card = objectType({
  name: "Card",
  definition(t) {
    t.string("name", { nullable: true });
    t.int("expMonth");
    t.int("expYear");
    t.string("last4");
    t.string("brand", { nullable: true });
    t.string("billingEmail", { nullable: true });
    t.string("company", { nullable: true });
  }
});

const DeploymentStatus = objectType({
  name: "DeploymentStatus",
  definition(t) {
    t.field("result", { type: "JSON" });
  }
});

const DeploymentLog = objectType({
  name: "DeploymentLog",
  definition(t) {
    t.string("id");
    t.string("component", { nullable: true });
    t.string("timestamp", { nullable: true });
    t.string("release", { nullable: true });
    t.string("level", { nullable: true });
    t.string("message", { nullable: true });
  }
});

const DeploymentMetric = objectType({
  name: "DeploymentMetric",
  definition(t) {
    t.string("label", { nullable: true });
    t.field("result", { nullable: true, type: "JSON" });
  }
});

export default [
  AirflowImage,
  AppConfig,
  AstroUnit,
  AuthConfig,
  AuthProvider,
  AuthUser,
  AuthUserCapabilities,
  Card,
  DeployInfo,
  Deployment,
  DeploymentCapabilities,
  DeploymentConfig,
  DeploymentLog,
  DeploymentMetric,
  DeploymentStatus,
  DeploymentUrl,
  DockerImage,
  Email,
  EntityType,
  Invite,
  InviteSearch,
  InviteToken,
  JSON,
  LocalCredential,
  MetricType,
  Operator,
  PlatformRelease,
  Role,
  RoleBinding,
  ServiceAccount,
  Token,
  TokenPayload,
  User,
  UserProp,
  UserSearch,
  Uuid,
  Workspace,
  WorkspaceCapabilities
];
