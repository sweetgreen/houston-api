/*
 * This resolver is pretty much just for compatibility purposes.
 * It can be removed once the UI and the cli are up to date with the API.
 * @param {Object} parent The result of the parent resolver.
 * @return {[]Object} Array of key/value profile values.
 */
export function profile({ avatarUrl }) {
  const profile = [];
  avatarUrl && profile.push({ key: "avatarUrl", value: avatarUrl });
  return profile;
}

export default { profile };
