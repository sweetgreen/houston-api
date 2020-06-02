export const deploymentFragment = `fragment EnsureFields on Deployment {
  id
  config
  releaseName
  version
  extraAu
  airflowVersion
  alertEmails
  workspace { id }
  rollouts { id }
  createdAt
}`;

export const workspaceFragment = `{
  stripeCustomerId
  isSuspended
  deployments { id, deletedAt }
}`;
