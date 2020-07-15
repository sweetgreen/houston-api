import log from "logger";
import nats from "node-nats-streaming";
import config from "config";

/**
 * @param  {String} clientID name of the client to identify requests (unique)
 * @param  {String} subject subject to publish and subscribe (shared)
 * @param  {Function} messageHandler to accept the NATS message
 */
export function pubSub(clientID, subject, messageHandler) {
  const nc = publisher(clientID);
  let sub = {};

  // Subscribe after successful connection
  nc.on("connect", () => {
    log.info(`Connected to ${nc.options.url}`);
    sub = createSubscriber(nc, clientID, subject);
    // Subscribe and assign event handler
    sub.on("message", messageHandler);
    log.info(`Subscribed to: ${subject}`);
  });

  // Emitted whenever the client reconnects
  // reconnect callback provides a reference to the connection as an argument
  nc.on("reconnect", nc => {
    log.info(`Reconnected to ${nc.options.url}`);

    // Unsubscribe so we can reconnect and resubscribe to keep the worker running
    sub.unsubscribe && sub.unsubscribe("message");
    log.info(`Unsubscribed from: ${subject}`);

    // Reconnect to STAN again or the worker will shutdown
    return pubSub(clientID, subject, messageHandler);
  });

  return nc;
}

/**
 * @param  {String} clientID name of the client to identify requests (unique)
 */
export function publisher(clientID) {
  const natsConfig = config.get("nats");
  const clusterID = natsConfig.clusterID;
  const opts = getNatsStreamingOptions();

  return createNatsConnection(clusterID, clientID, opts);
}

/**
 * @param  {String} clusterID given from the NATS configuration
 * @param  {String} clientID unique for every NATS connection
 * @param  {Object} opts NATS options
 * @return {Object} nc the NATS Streaming Object
 */
function createNatsConnection(clusterID, clientID, opts) {
  log.info(
    `Connecting to NATS clusterID: ${clusterID} clientID: ${clientID} options: ${JSON.stringify(
      opts
    )}`
  );

  const nc = nats.connect(clusterID, clientID, opts);

  nc.on("connect", () => {
    log.info(
      `Connected to NATS clusterID: ${clusterID} clientID: ${clientID} url: ${nc.options.url}`
    );
  });

  nc.on("error", msg => {
    log.error(`NATS Error for client: ${clientID}.`);
    log.error(msg);
  });

  nc.on("disconnect", () => {
    log.error(
      `Disconnected from clusterID: ${clusterID} clientID: ${clientID} url: ${opts.url}`
    );
  });

  nc.on("reconnecting", () => {
    log.info(
      `Attempting to reconnect to clusterID: ${clusterID} clientID: ${clientID} url: ${opts.url}`
    );
  });

  nc.on("connection_lost", error => {
    log.info(`NATS Streaming ${error}`);
  });

  nc.on("close", err => {
    if (err) {
      log.error(
        `Error closing connection for clusterID: ${clusterID} clientID: ${clientID} error: ${err}`
      );
    } else {
      log.info(
        `Closed connection for clusterID: ${clusterID} clientID: ${clientID} url: ${opts.url}`
      );
    }
  });

  return nc;
}

/**
 * Get Options for NATS Streaming
 * @return {Object} NATS Streaming opts - https://github.com/nats-io/stan.js#connect-options
 */
function getNatsStreamingOptions() {
  const natsConfig = config.get("nats");
  const { host, port } = natsConfig;
  const url = `${host}:${port}`;

  return { ...natsConfig, url };
}

/**
 * Create Subscriber
 * @return {Object} subscriber
 */
function createSubscriber(nc, clientID, subject) {
  // Create subscription options
  const opts = nc.subscriptionOptions();
  opts.setDeliverAllAvailable();
  opts.setManualAckMode(true);
  opts.setDurableName(clientID);

  return nc.subscribe(subject, opts);
}
