import nats from "node-nats-streaming";

export function ncFactory(clusterID, clientID, subject, messageHandler) {
  const nc = nats.connect(clusterID, clientID);

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