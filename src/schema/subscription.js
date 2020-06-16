import deploymentStatus from "../resolvers/subscription/deployment-status";
import deploymentLogs from "../resolvers/subscription/log";
import deploymentMetrics from "../resolvers/subscription/metrics";

import { PubSub } from "graphql-subscriptions";

import { arg, intArg, stringArg, subscriptionField } from "@nexus/schema";

const DeploymentStatus = subscriptionField("deploymentStatus", {
  type: "DeploymentStatus",
  args: {
    releaseName: stringArg()
  },
  subscribe: (parent, args, context) => {
    return deploymentStatus.subscribe(parent, args, context, {
      pubsub: new PubSub()
    });
  }
});

const DeploymentLogs = subscriptionField("log", {
  type: "DeploymentLog",
  args: {
    deploymentUuid: arg({ type: "Uuid", required: true }),
    component: stringArg({ nullable: true }),
    timestamp: stringArg({ nullable: true }),
    search: stringArg({ nullable: true })
  },
  subscribe: (parent, args, context) => {
    return deploymentLogs.subscribe(parent, args, context, {
      pubsub: new PubSub()
    });
  }
});

const DeploymentMetrics = subscriptionField("metrics", {
  type: "DeploymentMetric",
  args: {
    deploymentUuid: arg({ type: "Uuid", required: true }),
    metricType: arg({ type: "MetricType", required: false, list: true }),
    since: intArg({ nullable: true }),
    step: intArg({ nullable: true })
  },
  subscribe: (parent, args, context) => {
    return deploymentMetrics.subscribe(parent, args, context, {
      pubsub: new PubSub()
    });
  }
});

export default [DeploymentStatus, DeploymentLogs, DeploymentMetrics];
