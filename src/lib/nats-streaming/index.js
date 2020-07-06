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
  nc.connectHandler = () => {
    log.info(`Connected to ${nc.options.url}`);
    sub = createSubscriber(nc, clientID, subject);
    // Subscribe and assign event handler
    sub.on("message", messageHandler);
    log.info(`Subscribed to: ${subject}`);
  };

  // Emitted whenever the client reconnects
  // reconnect callback provides a reference to the connection as an argument
  nc.reconnectHandler = nc => {
    log.info(`Reconnected to ${nc.options.url}`);

    // Unsubscribe so we can reconnect and resubscribe to keep the worker running
    sub.unsubscribe("message");
    log.info(`Unsubscribed from: ${subject}`);

    // Reconnect to STAN again or the worker will shutdown
    return pubSub(clientID, subject, messageHandler);
  };

  nc.on("connect", nc.connectHandler);
  nc.on("reconnect", nc.reconnectHandler);

  return nc;
}

/**
 * @param  {String} clientID name of the client to identify requests (unique)
 */
export function publisher(clientID) {
  const natsConfig = config.get("nats");
  const clusterID = natsConfig.clusterID;
  const opts = getNatsStreamingOptions();

  log.info(`Connecting to NATS with options: ${JSON.stringify(opts)}`);

  const nc = nats.connect(clusterID, clientID, opts);

  nc.errorHandler = msg => {
    log.error(`NATS Error for client: ${clientID}.`);
    log.error(msg);
  };

  nc.disconnectHandler = () => {
    log.error(`Disconnected: ${opts.url}`);
  };

  nc.reconnectingHandler = () => {
    log.info(`Attempting to reconnect to ${opts.url}`);
  };

  nc.connectionLostHandler = error => {
    log.info(`NATS Streaming ${error}`);
  };

  nc.on("error", nc.errorHandler);
  nc.on("disconnect", nc.disconnectHandler);
  nc.on("reconnecting", nc.reconnectingHandler);
  nc.on("connection_lost", nc.connectionLostHandler);

  return nc;
}

/**
 * Get Options for NATS Streaming
 * @return {Object} NATS Streaming opts - https://github.com/nats-io/stan.js#connect-options
 */
function getNatsStreamingOptions() {
  const natsConfig = config.get("nats");
  const url = `${natsConfig.host}:${natsConfig.port}`;
  const ackTimeout = 30000;
  const connectTimeout = 3000;
  const maxPubAcksInflight = 16384;
  const maxReconnectAttempts = -1;
  const stanMaxPingOut = 20;
  const stanPingInterval = 5000;
  const reconnect = true;
  const reconnectTimeWait = 5000;
  const reconnectJitter = 150;
  const reconnectJitterTLS = 1000;
  const waitOnFirstConnect = true;

  return {
    url,
    ackTimeout,
    connectTimeout,
    maxPubAcksInflight,
    maxReconnectAttempts,
    stanMaxPingOut,
    stanPingInterval,
    reconnect,
    reconnectJitter,
    reconnectJitterTLS,
    reconnectTimeWait,
    waitOnFirstConnect
  };
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
