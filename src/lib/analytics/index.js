import config from "config";
const Analytics = require("analytics-node");

// Get the analytics settings
const { enabled, writeKey } = config.get("analytics");

// Create the analytics-node client
const client = new Analytics(writeKey);

// Form the identify function. userId should be passed as a string and
// traits should be passed as an object of key/value pairs.
export function identify(userId, traits) {
  if (enabled) {
    client.identify({ userId, traits });
  }
}

export function track(userId, event, properties) {
  if (enabled) {
    client.track({ userId, event, properties });
  }
}
