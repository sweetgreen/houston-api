import log from "logger";
import nats from "node-nats-streaming";
import config from "config";

export async function natsPubSub(clientID, subject, messageHandler) {
  const nc = natsPublisher(clientID);

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

export function natsPublisher(clientID) {
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
