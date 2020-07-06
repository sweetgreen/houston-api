export const queryFragment = `fragment EnsureFields on Deployment {
  id
  config
  releaseName
  workspace {
    id
    stripeCustomerId
    isSuspended
  }
  version
  extraAu
  airflowVersion
  alertEmails
}`;
