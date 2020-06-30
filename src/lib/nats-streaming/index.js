import log from "logger";
import nats from "node-nats-streaming";
import config from "config";

export function natsPubSub(clientID, subject, messageHandler) {
  const nc = natsPublisher(clientID);

  // Attach handler
  nc.on("connect", function() {
    // Create subscription options
    const opts = nc.subscriptionOptions();
    opts.setDeliverAllAvailable();
    opts.setManualAckMode(true);
    opts.setAckWait(300 * 1000);
    opts.setDurableName(clientID);

    // Subscribe and assign event handler
    const sub = nc.subscribe(subject, opts);
    sub.on("message", messageHandler);

    log.info("Subscribing to ", sub);
  });

  return nc;
}

export function natsPublisher(clientID) {
  const clusterID = "houston-api";
  const natsConfig = config.get("nats");
  const url = `${natsConfig.host}:${natsConfig.port}`;
  const opts = {
    url
  };
  log.info(JSON.stringify(opts));

  const nc = nats.connect(clusterID, clientID, opts);

  log.info(JSON.stringify(nc));

  return nc;
}
