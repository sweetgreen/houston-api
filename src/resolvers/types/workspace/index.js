import { hasPermission } from "rbac";
import config from "config";
import { filter, isNull } from "lodash";
import moment from "moment";
import { ENTITY_WORKSPACE } from "constants";

export function users(parent, args, ctx) {
  return ctx.prisma.user.findMany({
    where: {
      roleBindings: {
        some: { workspace: { id: parent.id } }
      }
    }
  });
}

export function deployments(parent) {
  return filter(parent.deployments, d => isNull(d.deletedAt));
}

export function invites(parent, args, ctx) {
  return ctx.prisma.inviteToken.findMany({
    where: { workspace: { id: parent.id } }
  });
}

/*
 * Return boolean flags indicating what the current user has access to
 * on a particular workspace.
 * @param {Object} parent The result of the parent resolver.
 * @param {Object} args The graphql arguments.
 * @param {Object} ctx The graphql context.
 * @return {WorkspaceCapabilities} Map of boolean capabilities.
 */
export function workspaceCapabilities(parent, args, ctx) {
  const permissions = [
    {
      key: "canGetWorkspace",
      value: "workspace.config.get"
    },
    {
      key: "canUpdateBilling",
      value: "workspace.billing.update"
    },
    {
      key: "canUpdateIAM",
      value: "workspace.iam.update"
    },
    {
      key: "canUpdateWorkspace",
      value: "workspace.config.update"
    },
    {
      key: "canDeleteWorkspace",
      value: "workspace.config.delete"
    },
    {
      key: "canCreateDeployment",
      value: "workspace.deployments.create"
    },
    {
      key: "canInviteUser",
      value: "workspace.invites.get"
    },
    {
      key: "canUpdateUser",
      value: "workspace.iam.update"
    },
    {
      key: "canDeleteUser",
      value: "workspace.iam.update"
    },
    {
      key: "canCreateServiceAccount",
      value: "workspace.serviceAccounts.create"
    },
    {
      key: "canUpdateServiceAccount",
      value: "workspace.serviceAccounts.update"
    },
    {
      key: "canDeleteServiceAccount",
      value: "workspace.serviceAccounts.delete"
    }
  ];

  const capabilities = [];
  permissions.map(p => {
    capabilities[p.key] = hasPermission(
      ctx.user,
      p.value,
      ENTITY_WORKSPACE.toLowerCase(),
      parent.id
    );
  });

  return capabilities;
}

// Check the config to see if stripe is enabled (Cloud mode)
export function billingEnabled() {
  return config.get("stripe.enabled");
}

// Function to determine if the user should be blocked from viewing their workspace
export async function paywallEnabled(parent, args, ctx) {
  // Check for hard override of trial paywall logic and throw paywall
  const workspace = await ctx.prisma.workspace.findOne({
    where: { id: parent.id }
  });

  const now = new Date();

  const isTrialing = moment(workspace.trialEndsAt).isAfter(now);

  const paywallEnabled = workspace.isSuspended
    ? true
    : !isTrialing && workspace.stripeCustomerId == null;

  return paywallEnabled;
}

export default {
  users,
  deployments,
  invites,
  workspaceCapabilities,
  billingEnabled,
  paywallEnabled
};
