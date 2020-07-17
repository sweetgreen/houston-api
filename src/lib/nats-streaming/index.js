import log from "logger";
import nats from "node-nats-streaming";
import config from "config";
/**
 * @param  {String} clientID name of the client to identify requests (unique)
 * @param  {String} subject subject to publish and subscribe (shared)
 * @param  {Function} messageHandler to accept the NATS message
 */
export function pubSub(clientID, subject, messageHandler) {
  const natsConfig = config.get("nats");
  const clusterID = natsConfig.clusterID;
  let sub = {};
  log.info(`clientID: ${clientID}`);
  const nc = createNatsConnection(clusterID, clientID);

  // Subscribe after successful connection
  nc.on("connect", () => {
    logConnected(nc);
    sub = createSubscriber(nc, subject, messageHandler);
  });

  // Emitted whenever the client reconnects
  // reconnect callback provides a reference to the connection as an argument
  nc.on("reconnect", nc => {
    logReconnected(nc);
    // Unsubscribe so we can reconnect and resubscribe to keep the worker running
    sub.unsubscribe && sub.unsubscribe("message");
    log.info(`Unsubscribed from: ${subject}`);
    // Close old connection to prevent orphaning the connection
    nc.close();
    // Reconnect to STAN again or the worker will shutdown
    return pubSub(clientID, subject, messageHandler);
  });

  nc.on("close", err => {
    logClosed(nc, err);
  });

  nc.on("connection_lost", err => {
    logConnectionLost(nc, err);
  });

  nc.on("disconnect", () => {
    logDisconnect(nc);
  });

  nc.on("error", err => {
    logError(nc, err);
  });

  nc.on("reconnecting", () => {
    logReconnecting(nc);
  });

  return nc;
}

/**
 * @param  {String} clientID name of the client to identify requests (unique)
 */
export function publisher(clientID) {
  const natsConfig = config.get("nats");
  const clusterID = natsConfig.clusterID;
  const nc = createNatsConnection(clusterID, clientID);

  nc.on("connect", () => {
    logConnected(nc);
  });

  nc.on("close", err => {
    logClosed(nc, err);
  });

  nc.on("connection_lost", err => {
    logConnectionLost(nc, err);
  });

  nc.on("disconnect", () => {
    logDisconnect(nc);
  });

  nc.on("error", err => {
    logError(nc, err);
  });

  nc.on("reconnect", nc => {
    const { clientID } = nc;
    logReconnected(nc);
    nc.close();

    return publisher(clientID);
  });

  nc.on("reconnecting", () => {
    logReconnecting(nc);
  });

  return nc;
}

/**
 * @param  {String} clusterID given from the NATS configuration
 * @param  {String} clientID unique for every NATS connection
 * @param  {Object} opts NATS options
 * @return {Object} nc the NATS Streaming Object
 */
function createNatsConnection(clusterID, clientID) {
  const opts = getNatsStreamingOptions();

  log.info(
    `Connecting to NATS clusterID: ${clusterID} clientID: ${clientID} options: ${JSON.stringify(
      opts
    )}`
  );

  return nats.connect(clusterID, clientID, opts);
}

/**
 * Get Options for NATS Streaming
 * @return {Object} NATS Streaming opts - https://github.com/nats-io/stan.js#connect-options
 */
function getNatsStreamingOptions() {
  return config.get("nats");
}

/**
 * Create Subscriber
 * @return {Object} subscriber
 */
async function createSubscriber(nc, subject, messageHandler) {
  // Create subscription options
  const { clientID } = nc;
  const opts = nc.subscriptionOptions();
  opts.setDeliverAllAvailable();
  opts.setManualAckMode(true);
  opts.setDurableName(clientID);
  const sub = nc.subscribe(subject, opts);

  sub.on("ready", () => {
    log.info(`subscription ${clientID} is ready`);
    sub.on("message", messageHandler);
  });

  sub.on("error", err => {
    log.info(`subscription failed ${err}`);
  });

  sub.on("timeout", err => {
    log.error(`subscription timeout ${err}`);
  });

  sub.on("unsubscribed", () => {
    log.info(`subscription ${clientID} unsubscribed`);
  });

  return sub;
}

/**
 * Log a successful connection
 * @param  {Object} nc
 */
function logConnected(nc) {
  log.info(`Connected to NATS ${getConnectionMessage(nc)}`);
}

/**
 * Log connection closed
 * @param  {Object} nc
 * @param  {Object} err
 */
function logClosed(nc, err) {
  if (err) {
    log.error(`Error closing connection ${getConnectionMessage(nc)}`);
  } else {
    log.info(`Closed connection for ${getConnectionMessage(nc)}`);
  }
}

/**
 * Log connection error message
 * @param  {Object} nc
 */
function logError(nc, err) {
  log.error(`Error for ${getConnectionMessage(nc)}`);
  log.error(err);
}

/**
 * Log disconnect message
 * @param  {Object} nc
 */
function logDisconnect(nc) {
  log.error(`Disconnected from ${getConnectionMessage(nc)}`);
}

/**
 * Log reconnecting message
 * @param  {Object} nc
 */
function logReconnecting(nc) {
  log.info(`Attempting to reconnect to ${getConnectionMessage(nc)}`);
}

/**
 * Log reconnected message
 * @param  {Object} nc
 */
function logReconnected(nc) {
  log.info(`Reconnected to ${getConnectionMessage(nc)}`);
}

/**
 * Log Connection Lost message
 * @param  {Object} nc
 */
function logConnectionLost(nc, err) {
  log.info(`Connection lost for ${getConnectionMessage(nc)}`);
  log.error(err);
}

/**
 * Get formatted connection message
 * @param  {Object} nc
 * @return {String} connection message
 */
function getConnectionMessage(nc) {
  const { clusterID, clientID, options } = nc;
  return `clusterID: ${clusterID} clientID: ${clientID} url: ${options.url}`;
}
