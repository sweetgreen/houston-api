import { jsonArg } from "./types";
import mutations from "../resolvers/mutation";
import {
  idArg,
  stringArg,
  intArg,
  arg,
  mutationType,
  booleanArg
} from "@nexus/schema";

export default mutationType({
  definition(t) {
    t.field("createUser", {
      type: "AuthUser",
      nullable: true,
      args: {
        email: stringArg({ required: true }),
        password: stringArg({ required: true }),
        username: stringArg({ nullable: true }),
        profile: jsonArg({ nullable: true }),
        inviteToken: stringArg(),
        duration: intArg({ nullable: true })
      },
      resolve: mutations.createUser
    });

    t.field("confirmEmail", {
      type: "AuthUser",
      args: {
        token: stringArg(),
        duration: intArg({ nullable: true })
      },
      resolve: (root, args, context) =>
        mutations.confirmEmail(root, args, context)
    });

    t.field("createToken", {
      type: "AuthUser",
      args: {
        password: stringArg(),
        identity: stringArg({ nullable: true }),
        duration: intArg({ nullable: true })
      },
      resolve: mutations.createToken
    });

    t.field("forgotPassword", {
      type: "Boolean",
      args: {
        email: stringArg()
      },
      resolve: mutations.forgotPassword
    });

    t.field("resendConfirmation", {
      type: "Boolean",
      args: {
        email: stringArg()
      },
      resolve: mutations.resendConfirmation
    });

    t.field("resetPassword", {
      type: "AuthUser",
      args: {
        token: stringArg(),
        password: stringArg(),
        duration: intArg({ nullable: true })
      },
      resolve: mutations.resetPassword
    });

    t.field("createDeployment", {
      type: "Deployment",
      args: {
        workspaceUuid: "Uuid",
        releaseName: stringArg({ nullable: true }),
        type: stringArg(),
        label: stringArg(),
        description: stringArg({ nullable: true }),
        version: stringArg({ nullable: true }),
        airflowVersion: stringArg({ nullable: true }),
        config: arg({ type: "JSON", nullable: true }),
        env: arg({ type: "JSON", nullable: true }),
        properties: arg({ type: "JSON", nullable: true }),
        cloudRole: stringArg({ nullable: true })
      },
      resolve: (root, args, context) =>
        mutations.createDeployment(root, args, context)
    });

    t.field("updateDeployment", {
      type: "Deployment",
      args: {
        deploymentUuid: arg({ type: "Uuid", nullable: true }),
        payload: jsonArg({ nullable: true }),
        config: jsonArg({ nullable: true }),
        env: jsonArg({ nullable: true }),
        sync: booleanArg({ nullable: true }),
        cloudRole: stringArg({ nullable: true })
      },
      resolve: mutations.updateDeployment
    });

    t.field("deploymentAlertsUpdate", {
      type: "Deployment",
      args: {
        deploymentUuid: "Uuid",
        alertEmails: arg({ type: "String", list: true })
      },
      resolve: mutations.deploymentAlertsUpdate
    });

    t.field("deleteDeployment", {
      type: "Deployment",
      args: {
        deploymentUuid: "Uuid"
      },
      resolve: mutations.deleteDeployment
    });

    t.field("deleteWorkspace", {
      type: "Workspace",
      args: {
        workspaceUuid: "Uuid"
      },
      resolve: mutations.deleteWorkspace
    });

    t.field("updateUser", {
      type: "User",
      args: {
        userId: "Uuid",
        payload: arg({ type: "JSON", nullable: true })
      },
      resolve: mutations.updateUser
    });

    t.field("removeUser", {
      type: "User",
      args: {
        userUuid: "Uuid"
      },
      resolve: mutations.removeUser
    });

    t.field("createWorkspace", {
      type: "Workspace",
      args: {
        label: stringArg(),
        description: stringArg(),
        isSuspended: booleanArg(),
        trialEndsAt: stringArg()
      },
      resolve: mutations.createWorkspace
    });

    t.field("workspaceAddUser", {
      type: "Workspace",
      args: {
        email: stringArg(),
        workspaceUuid: arg({ type: "Uuid", nullable: true }),
        role: arg({
          type: "Role",
          default: "WORKSPACE_VIEWER",
          required: false
        })
      },
      resolve: mutations.workspaceAddUser
    });

    t.field("workspaceUpdateUserRole", {
      type: "Role",
      args: {
        email: stringArg(),
        workspaceUuid: "Uuid",
        role: "Role"
      },
      resolve: mutations.workspaceUpdateUserRole
    });

    t.field("workspaceRemoveUser", {
      type: "Workspace",
      args: {
        userUuid: "Uuid",
        workspaceUuid: "Uuid"
      },
      resolve: mutations.workspaceRemoveUser
    });

    t.field("deleteInviteToken", {
      type: "Invite",
      args: {
        inviteUuid: "Uuid"
      },
      resolve: mutations.deleteInviteToken
    });

    t.field("updateWorkspace", {
      type: "Workspace",
      args: {
        workspaceUuid: "Uuid",
        payload: "JSON"
      },
      resolve: mutations.updateWorkspace
    });

    t.field("upgradeDeployment", {
      type: "Deployment",
      args: {
        deploymentUuid: "Uuid",
        version: stringArg()
      },
      resolve: mutations.upgradeDeployment
    });

    // ServiceAccount mutations are handled differently at the moment to maintain
    // backward compatibility with CLI / UI. We should refactor to
    // more explicit, scoped mutations.
    // Legacy - backwards compatibility
    t.field("createServiceAccount", {
      type: "ServiceAccount",
      args: {
        label: stringArg(),
        category: stringArg({ nullable: true }),
        entityType: arg({ type: "EntityType" }),
        entityUuid: arg({ type: "Uuid", nullable: true }),
        role: arg({ type: "Role" })
      },
      resolve: mutations.createServiceAccount
    });

    t.field("createDeploymentServiceAccount", {
      type: "ServiceAccount",
      args: {
        label: stringArg(),
        category: stringArg({ nullable: true }),
        deploymentUuid: arg({ type: "Uuid" }),
        role: arg({ type: "Role" })
      },
      resolve: (root, args, context) =>
        mutations.createDeploymentServiceAccount(root, args, context)
    });

    // New ServiceAccount scoped mutation
    t.field("createWorkspaceServiceAccount", {
      type: "ServiceAccount",
      args: {
        label: stringArg(),
        category: stringArg({ nullable: true }),
        workspaceUuid: "Uuid",
        role: "Role"
      },
      resolve: mutations.createWorkspaceServiceAccount
    });

    //  # New ServiceAccount scoped mutation
    t.field("createSystemServiceAccount", {
      type: "ServiceAccount",
      args: {
        label: stringArg(),
        category: stringArg({ nullable: true }),
        role: arg({ type: "Role" })
      },
      resolve: mutations.createSystemServiceAccount
    });

    // Legacy - backwards compatibility
    // TODO: remove?
    t.field("updateServiceAccount", {
      type: "ServiceAccount",
      args: {
        serviceAccountUuid: "Uuid",
        payload: "JSON"
      },
      resolve: mutations.updateServiceAccount
    });

    t.field("updateWorkspaceServiceAccount", {
      type: "ServiceAccount",
      args: {
        serviceAccountUuid: "Uuid",
        workspaceUuid: "Uuid",
        payload: "JSON"
      },
      resolve: mutations.updateWorkspaceServiceAccount
    });

    t.field("updateDeploymentServiceAccount", {
      type: "ServiceAccount",
      args: {
        serviceAccountUuid: "Uuid",
        deploymentUuid: "Uuid",
        payload: "JSON"
      },
      resolve: mutations.updateDeploymentServiceAccount
    });

    // Legacy - backwards compatibility
    t.field("deleteServiceAccount", {
      type: "ServiceAccount",
      args: {
        serviceAccountUuid: "Uuid"
      },
      resolve: mutations.deleteServiceAccount
    });

    t.field("deleteWorkspaceServiceAccount", {
      type: "ServiceAccount",
      args: {
        serviceAccountUuid: "Uuid",
        workspaceUuid: "Uuid"
      },
      resolve: mutations.deleteWorkspaceServiceAccount
    });

    t.field("deleteDeploymentServiceAccount", {
      type: "ServiceAccount",
      args: {
        serviceAccountUuid: "Uuid",
        deploymentUuid: "Uuid"
      },
      resolve: mutations.deleteDeploymentServiceAccount
    });

    t.field("deleteSystemServiceAccount", {
      type: "ServiceAccount",
      args: {
        serviceAccountUuid: "Uuid"
      },
      resolve: mutations.deleteSystemServiceAccount
    });

    t.field("createSystemRoleBinding", {
      type: "RoleBinding",
      args: {
        userId: idArg(),
        role: arg({ type: "Role" })
      },
      resolve: mutations.createSystemRoleBinding
    });

    t.field("deleteSystemRoleBinding", {
      type: "RoleBinding",
      args: {
        userId: idArg(),
        role: arg({ type: "Role" })
      },
      resolve: mutations.deleteSystemRoleBinding
    });

    // Invite a user to create an account in this system. Useful when signups are
    // disabled on the platform. To invite a user (new or existing) to a workspace
    // use the workspaceAddUser mutation.
    t.field("inviteUser", {
      type: "Invite",
      args: {
        email: stringArg()
      },
      resolve: mutations.inviteUser
    });

    t.field("addCard", {
      type: "Card",
      args: {
        workspaceUuid: "Uuid",
        billingEmail: stringArg(),
        company: stringArg(),
        token: stringArg()
      },
      resolve: mutations.addCard
    });

    t.field("addCustomerId", {
      type: "Workspace",
      args: {
        workspaceUuid: "Uuid",
        stripeCustomerId: stringArg()
      },
      resolve: mutations.addCustomerId
    });

    t.field("updateCard", {
      type: "Card",
      args: {
        workspaceUuid: "Uuid",
        billingEmail: stringArg(),
        company: stringArg(),
        token: stringArg()
      },
      resolve: mutations.updateCard
    });

    t.field("suspendWorkspace", {
      type: "Workspace",
      args: {
        workspaceUuid: "Uuid",
        isSuspended: booleanArg()
      },
      resolve: mutations.suspendWorkspace
    });

    t.field("extendWorkspaceTrial", {
      type: "Workspace",
      args: {
        workspaceUuid: "Uuid",
        extraDays: intArg()
      },
      resolve: mutations.extendWorkspaceTrial
    });

    t.field("verifyEmail", {
      type: "Boolean",
      args: {
        email: stringArg()
      },
      resolve: mutations.verifyEmail
    });
  }
});
