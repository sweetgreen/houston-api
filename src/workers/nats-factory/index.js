import nats from "node-nats-streaming";
import config from "config";

export function natsFactory(clusterID, clientID, subject, messageHandler) {
  const nc = natsConnect(clusterID, clientID);

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
  });

  return nc;
}

export function natsConnect(clusterID, clientID) {
  const natsConfig = config.get("nats");
  const url = `nats://${natsConfig.host}:${natsConfig.port}`;
  const opts = {
    url
  };

  return nats.connect(clusterID, clientID, opts);
}
