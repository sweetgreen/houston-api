import { PermissionError } from "errors";
import { hasPermission } from "rbac";
import { rule, shield, and, or } from "graphql-shield";

const isAuth = rule({ cache: "contextual" })(async (parent, args, ctx) => {
  ctx.user = ctx.req.session.user;
  const exists = ctx.user !== null;
  if (!exists) throw new PermissionError();
  return exists;
});

const hasRBAC = role =>
  rule({ cache: "contextual" })(async (parent, args, ctx) => {
    // Get the 1st constraint of the permission
    let entityType = role.split(".")[0];
    let entityId = "";

    // Extendable to add more entity checks to RBAC
    switch (entityType) {
      case "workspace":
        entityId = args.workspaceUuid;
        break;
      case "deployment":
        entityId = args.deploymentUuid;
        break;
      case "serviceAccount":
        entityId = args.serviceAccountUuid;
        break;
      default:
        break;
    }

    const allowed = hasPermission(ctx.user, role, entityType, entityId);
    return allowed;
  });

export const permissions = shield(
  {
    Subscription: {
      deploymentStatus: isAuth
    },
    Query: {
      self: isAuth,
      deploymentConfig: isAuth,
      workspaces: isAuth,
      workspace: and(
        isAuth,
        or(
          hasRBAC("workspace.deployments.get"),
          hasRBAC("system.deployments.get")
        )
      ),
      updateAvailable: and(isAuth, hasRBAC("system.updates.get")),
      users: and(isAuth, hasRBAC("system.users.get")),
      deployments: and(isAuth, hasRBAC("system.deployments.get")),
      invites: and(isAuth, hasRBAC("system.users.get")),
      card: and(isAuth, hasRBAC("workspace.billing.update")),
      workspaceDeployments: and(
        isAuth,
        or(
          hasRBAC("workspace.deployments.get"),
          hasRBAC("system.deployments.get")
        )
      ),
      workspaceDeployment: and(
        isAuth,
        or(
          hasRBAC("workspace.deployments.get"),
          hasRBAC("system.deployments.get")
        )
      ),
      workspaceServiceAccounts: and(
        isAuth,
        or(
          hasRBAC("workspace.serviceAccounts.get"),
          hasRBAC("system.deployments.get")
        )
      ),
      workspaceServiceAccount: and(
        isAuth,
        or(
          hasRBAC("workspace.serviceAccounts.get"),
          hasRBAC("system.deployments.get")
        )
      ),
      workspaceUser: and(isAuth, hasRBAC("workspace.users.get")),
      workspaceUsers: and(isAuth, hasRBAC("workspace.users.get")),
      workspaceInvites: and(isAuth, hasRBAC("workspace.invites.get")),
      deploymentServiceAccount: and(
        isAuth,
        or(
          hasRBAC("deployment.serviceAccounts.get"),
          hasRBAC("system.serviceAccounts.get")
        )
      ),
      deploymentServiceAccounts: and(
        isAuth,
        or(
          hasRBAC("deployment.serviceAccounts.get"),
          hasRBAC("system.serviceAccounts.get")
        )
      )
    },
    Mutation: {
      updateSelf: isAuth,
      deleteInviteToken: isAuth,
      createServiceAccount: isAuth,
      updateServiceAccount: isAuth,
      deleteServiceAccount: isAuth,
      createSystemRoleBinding: and(isAuth, hasRBAC("system.iam.update")),
      deleteSystemRoleBinding: and(isAuth, hasRBAC("system.iam.update")),
      inviteUser: and(isAuth, hasRBAC("system.user.invite")),
      removeUser: and(isAuth, hasRBAC("system.user.delete")),
      verifyEmail: and(isAuth, hasRBAC("system.user.verifyEmail")),
      addCustomerId: and(isAuth, hasRBAC("system.workspace.addCustomerId")),
      createWorkspace: and(isAuth, hasRBAC("system.workspace.create")),
      suspendWorkspace: and(isAuth, hasRBAC("system.workspace.suspend")),
      extendWorkspaceTrial: and(
        isAuth,
        hasRBAC("system.workspace.extendTrial")
      ),
      addCard: and(isAuth, hasRBAC("workspace.billing.update")),
      updateCard: and(isAuth, hasRBAC("workspace.billing.update")),
      workspaceAddUser: and(
        isAuth,
        or(hasRBAC("workspace.iam.update"), hasRBAC("system.iam.update"))
      ),
      workspaceUpdateUserRole: and(isAuth, hasRBAC("workspace.iam.update")),
      workspaceRemoveUser: and(isAuth, hasRBAC("workspace.iam.update")),
      createDeployment: and(isAuth, hasRBAC("workspace.deployments.create")),
      updateDeployment: and(
        isAuth,
        or(
          hasRBAC("deployment.config.update"),
          hasRBAC("system.deployments.update")
        )
      ),
      deploymentAlertsUpdate: and(
        isAuth,
        or(
          hasRBAC("deployment.config.update"),
          hasRBAC("system.deployments.update")
        )
      ),
      deleteDeployment: and(
        isAuth,
        or(
          hasRBAC("deployment.config.delete"),
          hasRBAC("system.deployments.delete")
        )
      ),
      updateWorkspace: and(isAuth, hasRBAC("workspace.config.update")),
      upgradeDeployment: and(
        isAuth,
        or(
          hasRBAC("deployment.config.update"),
          hasRBAC("system.deployments.update")
        )
      ),
      deleteWorkspace: and(
        isAuth,
        or(
          hasRBAC("workspace.config.delete"),
          hasRBAC("system.workspace.delete")
        )
      ),
      createSystemServiceAccount: and(
        isAuth,
        hasRBAC("system.serviceAccounts.create")
      ),
      deleteSystemServiceAccount: and(
        isAuth,
        hasRBAC("system.serviceAccounts.delete")
      ),
      createDeploymentServiceAccount: and(
        isAuth,
        or(
          hasRBAC("deployment.serviceAccounts.create"),
          hasRBAC("system.serviceAccounts.create")
        )
      ),
      createWorkspaceServiceAccount: and(
        isAuth,
        or(
          hasRBAC("workspace.serviceAccounts.create"),
          hasRBAC("system.serviceAccounts.create")
        )
      ),
      updateDeploymentServiceAccount: and(
        isAuth,
        or(
          hasRBAC("deployment.serviceAccounts.update"),
          hasRBAC("system.serviceAccounts.update")
        )
      ),
      updateWorkspaceServiceAccount: and(
        isAuth,
        or(
          hasRBAC("workspace.serviceAccounts.update"),
          hasRBAC("system.serviceAccounts.update")
        )
      ),
      deleteDeploymentServiceAccount: and(
        isAuth,
        or(
          hasRBAC("deployment.serviceAccounts.delete"),
          hasRBAC("system.serviceAccounts.delete")
        )
      ),
      deleteWorkspaceServiceAccount: and(
        isAuth,
        or(
          hasRBAC("workspace.serviceAccounts.delete"),
          hasRBAC("system.serviceAccounts.delete")
        )
      ),
      confirmEmail: isAuth
    }
  },
  {
    fallbackError: "Insufficient permissions.",
    allowExternalErrors: true,
    debug: true
  }
);
