import log from "logger";
import nats from "node-nats-streaming";
import config from "config";

export function natsPubSub(clientID, subject, queueGroup, messageHandler) {
  const nc = natsPublisher(clientID);

  // Attach handler
  nc.on("connect", function() {
    // Create subscription options
    const opts = nc.subscriptionOptions();
    opts.setDeliverAllAvailable();
    opts.setManualAckMode(true);
    opts.setAckWait(3000);
    opts.setDurableName(clientID);

    // Subscribe and assign event handler
    const sub = nc.subscribe(subject, queueGroup, opts);
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
  log.info(JSON.stringify(opts));

  const nc = nats.connect(clusterID, clientID, opts);

  return nc;
}
