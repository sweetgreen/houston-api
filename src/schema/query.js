import queries from "../resolvers/query";
import { queryType, arg, stringArg, intArg } from "@nexus/schema";

export default queryType({
  name: "Query",
  definition(t) {
    t.crud.email();
    t.crud.workspace();
    t.crud.deployment();
    //////////////////
    // No RBAC ///////
    //////////////////

    t.field("authConfig", {
      type: "AuthConfig",
      args: {
        redirect: stringArg({ nullable: true }),
        duration: intArg({ nullable: true }),
        extras: arg({ type: "JSON", nullable: true }),
        inviteToken: stringArg({ nullable: true })
      },
      resolve: queries.authConfig
    });

    ////////////////////
    // Auth User RBAC //
    ////////////////////

    t.field("appConfig", {
      type: "AppConfig",
      nullable: true,
      resolve: (root, args, context) => queries.appConfig(root, args, context)
    });

    t.field("self", {
      type: "AuthUser",
      resolve: (root, args, context) => queries.self(root, args, context)
    });

    t.field("deploymentConfig", {
      type: "DeploymentConfig",
      args: {
        workspaceUuid: arg({ type: "Uuid", nullable: true }),
        deploymentUuid: arg({ type: "Uuid", nullable: true }),
        type: stringArg({ nullable: true }),
        version: stringArg({ nullable: true })
      },
      resolve: (root, args, context) =>
        queries.deploymentConfig(root, args, context)
    });

    t.field("workspaces", {
      type: "Workspace",
      list: true,
      nullable: true,
      resolve: (root, args, context) => queries.workspaces(root, args, context)
    });

    ////////////////////
    // Sys Admin RBAC //
    ////////////////////

    t.field("updateAvailable", {
      type: "PlatformRelease",
      nullable: true,
      resolve: (root, args, context) =>
        queries.updateAvailable(root, args, context)
    });

    t.field("updateAvailable", {
      type: "PlatformRelease",
      nullable: true,
      resolve: (root, args, context) =>
        queries.updateAvailable(root, args, context)
    });

    t.field("users", {
      type: "User",
      list: true,
      args: {
        user: arg({ type: "UserSearch", nullable: true })
      },
      resolve: (root, args, context) => queries.users(root, args, context)
    });

    t.field("deployments", {
      type: "Deployment",
      nullable: true,
      list: true,
      resolve: (root, args, context) => queries.deployments(root, args, context)
    });

    t.field("invites", {
      type: "Invite",
      nullable: true,
      list: true,
      args: {
        invite: arg({ type: "InviteSearch", nullable: true })
      },
      resolve: (root, args, context) =>
        queries.inviteTokens(root, args, context)
    });

    ////////////////////
    // Workspace RBAC //
    ////////////////////

    t.field("workspace", {
      type: "Workspace",
      nullable: true,
      args: {
        workspaceUuid: arg({ type: "Uuid", required: true })
      },
      resolve: (root, args, context) => queries.workspace(root, args, context)
    });

    t.field("card", {
      type: "Card",
      args: {
        workspaceUuid: arg({ type: "Uuid", required: true }),
        stripeCustomerId: stringArg()
      },
      resolve: (root, args, context) => queries.card(root, args, context)
    });

    t.field("workspaceInvites", {
      type: "InviteToken",
      list: true,
      nullable: true,
      args: {
        workspaceUuid: arg({ type: "Uuid", required: true }),
        invite: arg({ type: "InviteSearch", nullable: true })
      },
      resolve: (root, args, context) =>
        queries.workspaceInvites(root, args, context)
    });

    t.field("workspaceDeployments", {
      type: "Deployment",
      list: true,
      nullable: true,
      args: {
        workspaceUuid: arg({ type: "Uuid", required: true }),
        releaseName: stringArg({ nullable: true })
      },
      resolve: (root, args, context) =>
        queries.workspaceDeployments(root, args, context)
    });

    t.field("workspaceDeployment", {
      type: "Deployment",
      nullable: true,
      args: {
        workspaceUuid: arg({ type: "Uuid", required: true }),
        releaseName: stringArg({ required: true })
      },
      resolve: (root, args, context) =>
        queries.workspaceDeployment(root, args, context)
    });

    // Legacy - backwards compatibility
    t.field("serviceAccounts", {
      type: "ServiceAccount",
      list: true,
      nullable: true,
      args: {
        serviceAccountUuid: arg({ type: "Uuid", nullable: true }),
        entityType: arg({ type: "EntityType", required: true }),
        entityUuid: arg({ type: "Uuid", nullable: true })
      },
      resolve: (root, args, context) =>
        queries.serviceAccounts(root, args, context)
    });

    t.field("workspaceServiceAccounts", {
      type: "ServiceAccount",
      list: true,
      nullable: true,
      args: { workspaceUuid: arg({ type: "Uuid", required: true }) },
      resolve: (root, args, context) =>
        queries.workspaceServiceAccounts(root, args, context)
    });

    t.field("workspaceServiceAccount", {
      type: "ServiceAccount",
      nullable: true,
      args: {
        workspaceUuid: arg({ type: "Uuid", required: true }),
        serviceAccountUuid: arg({ type: "Uuid", required: true })
      },
      resolve: (root, args, context) =>
        queries.workspaceServiceAccount(root, args, context)
    });

    t.field("workspaceUsers", {
      type: "User",
      list: true,
      nullable: true,
      args: {
        workspaceUuid: arg({ type: "Uuid", required: true }),
        user: arg({ type: "UserSearch", nullable: true })
      },
      resolve: (root, args, context) =>
        queries.workspaceUsers(root, args, context)
    });

    t.field("workspaceUser", {
      type: "User",
      nullable: true,
      args: {
        workspaceUuid: arg({ type: "Uuid", required: true }),
        user: arg({ type: "UserSearch", required: true })
      },
      resolve: (root, args, context) =>
        queries.workspaceUser(root, args, context)
    });

    /////////////////////
    // Deployment RBAC //
    /////////////////////

    t.field("deploymentServiceAccount", {
      type: "ServiceAccount",
      args: {
        deploymentUuid: arg({ type: "Uuid", required: true }),
        serviceAccountUuid: arg({ type: "Uuid", required: true })
      },
      resolve: (root, args, context) =>
        queries.deploymentServiceAccount(root, args, context)
    });

    t.field("deploymentServiceAccounts", {
      type: "ServiceAccount",
      list: true,
      nullable: true,
      args: { deploymentUuid: arg({ type: "Uuid", required: true }) },
      resolve: (root, args, context) =>
        queries.deploymentServiceAccounts(root, args, context)
    });

    // FIXME: Resolve without a type (data is on Elastic)
    // t.field("logs", {
    //   resolve: queries.logs
    //   // TODO: @auth(permissions: ["deployment.logs.get", "system.deployments.logs"], op: OR)
    // });
  }
});
