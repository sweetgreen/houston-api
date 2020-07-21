import nc, { deploymentUpdated } from "./index";
import { prisma } from "generated/client";
import log from "logger";
import { generateReleaseName } from "deployments/naming";
import casual from "casual";
import { AIRFLOW_EXECUTOR_DEFAULT } from "constants";

jest.mock("generated/client", () => {
  return {
    __esModule: true,
    prisma: jest.fn().mockName("MockPrisma")
  };
});

describe("deployment updated worker", () => {
  const id = casual.uuid;
  const sync = true;
  const workspace = { id };
  const version = "0.16.1";
  const config = { executor: AIRFLOW_EXECUTOR_DEFAULT };
  const extraAu = casual.integer(0, 500);
  const releaseName = generateReleaseName();
  const fragment = {
    id,
    config,
    releaseName,
    version,
    extraAu,
    workspace
  };
  const message = {
    getData: () => {
      return {
        id,
        sync
      };
    },
    ack: jest
      .fn()
      .mockName("ack")
      .mockReturnValue(true)
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    nc.close();
  });

  test("correctly sets up pubsub", async () => {
    const eventNames = nc.eventNames();
    const expectedEvents = [
      "close",
      "error",
      "disconnect",
      "reconnecting",
      "connection_lost",
      "connect",
      "reconnect"
    ];

    expect(nc.on).toBeTruthy();
    expect(nc.close).toBeTruthy();
    expect(eventNames.sort()).toEqual(expectedEvents.sort());
  });

  test("correctly deploys and updates", async () => {
    prisma.deployment = jest
      .fn()
      .mockName("deployment")
      .mockReturnValue({
        $fragment: () => {
          return fragment;
        }
      });

    await deploymentUpdated(message);

    expect(message.ack).toHaveBeenCalledTimes(1);
  });

  test("correctly deploys and updates without syncing", async () => {
    const noSyncMessage = {
      getData: () => {
        return {
          id,
          sync: false
        };
      },
      ack: jest
        .fn()
        .mockName("ack")
        .mockReturnValue(true)
    };
    prisma.deployment = jest
      .fn()
      .mockName("deployment")
      .mockReturnValue({
        $fragment: () => {
          return fragment;
        }
      });

    await deploymentUpdated(noSyncMessage);

    expect(noSyncMessage.ack).toHaveBeenCalledTimes(1);
  });

  test("correctly throw error when database is down", async () => {
    prisma.deployment = jest
      .fn()
      .mockName("deployment")
      .mockImplementation(() => {
        throw new Error("The database is down!");
      });

    jest.spyOn(log, "error").mockImplementation(() => "Test error message");

    await deploymentUpdated(message);

    expect(message.ack).toHaveBeenCalledTimes(0);
    expect(log.error).toHaveBeenCalledTimes(1);
  });
});
