export default `fragment EnsureFields on Deployment {
  id
  releaseName
  version
  extraAu,
  workspace { id }
}`;
