// eslint-disable-next-line import/extensions
import sampleData from "./sample.json";
import log from "logger";
import createPoller from "pubsub/poller";
import config from "config";
import request from "request-promise-native";
import moment from "moment";
import { defaultTo, get } from "lodash";

// Use sample data if prom is not enabled
const useSample = !config.get("prometheus.enabled");
const interval = config.get("prometheus.statusPollInterval");

// Return sample as a promise
const samplePromise = new Promise(resolve => {
  resolve(...sampleData);
});

// Build the Prometheus request URL
export function buildURI(query) {
  const now = moment().unix() - (moment().unix() % 15);
  const host = config.get("prometheus.host");
  const port = config.get("prometheus.port");
  return `http://${host}:${port}/api/v1/query?query=${encodeURI(
    query
  )}&time=${now}`;
}

export function isNotPending(res) {
  return defaultTo(get(res, "data.result[0].value.length"), 0) > 1;
}

export async function prometheusRequest(promQl) {
  return await request({
    method: "GET",
    json: true,
    uri: buildURI(promQl)
  });
}

export async function getMetric(releaseName) {
  let metric = null;
  const res = await prometheusRequest(`
      rate(airflow_scheduler_heartbeat{deployment=~"${releaseName}", type="counter"}[1m])
    `).catch(err => log.error(err));
  if (!res.data || res.status !== "success") {
    log.error(
      `Did not get response from prometheus as expected, we expected to find json with path data.result as an array and status = 'success'. Response was: ${res}`
    );
    return metric;
  }
  if (isNotPending(res)) {
    metric = res.data.result[0].value[1];
  }
  return metric;
}

// Start the subscription
export async function subscribe(parent, args, { pubsub }) {
  log.info("subscribe(parent, args, { pubsub })");
  log.info("parent", parent);
  log.info("args", args);
  let { releaseName } = args;
  const metric = await getMetric(releaseName);

  // Return sample data
  if (useSample) {
    return createPoller(publish => {
      publish({ deploymentStatus: { result: samplePromise } });
    }, pubsub);
  }

  // Return promQL data if in production
  return createPoller(
    async publish => {
      if (metric) {
        publish({
          deploymentStatus: {
            result: metric
          }
        });
      }
    },
    pubsub,
    interval,
    3600000 * 24 // Kill after 24 hours
  );
}

export default { subscribe };
