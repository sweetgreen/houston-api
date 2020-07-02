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

  // Subscribe after successful connection
  nc.on("connect", () => {
    // Create subscription options
    const ackWait = 3000;
    const opts = nc.subscriptionOptions();
    opts.setDeliverAllAvailable();
    opts.setManualAckMode(true);
    opts.setAckWait(ackWait);
    opts.setDurableName(clientID);

    // Subscribe and assign event handler
    const sub = nc.subscribe(subject, opts);
    sub.on("message", messageHandler);

    log.info(`Subscribing to: ${subject}`);
  });

  return nc;
}
/**
 * @param  {String} clientID name of the client to identify requests (unique)
 */
export function publisher(clientID) {
  const natsConfig = config.get("nats");
  const clusterID = natsConfig.clusterID;
  const url = `${natsConfig.host}:${natsConfig.port}`;
  const opts = {
    url
  };
  log.info(`Connecting to NATS with options: ${JSON.stringify(opts)}`);

  const nc = nats.connect(clusterID, clientID, opts);

  nc.on("error", msg => {
    log.error(`NATS Error for client: ${clientID}.`);
    log.error(msg);
  });

  return nc;
}
