import nc, { deploymentCreated } from "./index";
import { prisma } from "generated/client";
import { generateReleaseName } from "deployments/naming";
import log from "logger";
import casual from "casual";
import { DEPLOYMENT_CREATED_ID } from "constants";

jest.mock("generated/client", () => {
  return {
    __esModule: true,
    prisma: jest.fn().mockName("MockPrisma")
  };
});

describe("deployment created worker", () => {
  const id = casual.uuid;
  const stripeCustomerId = casual.uuid;
  const isSuspended = false;
  const workspace = { id, stripeCustomerId, isSuspended };
  const releaseName = generateReleaseName();
  const version = "0.16.1";
  const extraAu = 25;
  const fragment = {
    id,
    releaseName,
    extraAu,
    version,
    workspace
  };
  const message = {
    getData: () => id,
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
    expect(nc.clientID).toEqual(DEPLOYMENT_CREATED_ID);
    expect(eventNames.sort()).toEqual(expectedEvents.sort());
  });

  test.skip("correctly creates and deploys", async () => {
    prisma.deployment = jest
      .fn()
      .mockName("deployment")
      .mockReturnValue({
        $fragment: () => {
          return fragment;
        }
      });
    prisma.updateDeployment = jest
      .fn()
      .mockName("updateDeployment")
      .mockReturnValue({
        $fragment: function() {
          return {
            workspace: { id: casual.uuid },
            label: casual.word,
            id: casual.uuid,
            airflowVersion: "1.10.10"
          };
        }
      });

    await deploymentCreated(message);

    expect(message.ack).toHaveBeenCalledTimes(1);
  });

  test("correctly throw error when database is down for deployment", async () => {
    prisma.deployment = jest
      .fn()
      .mockName("deployment")
      .mockImplementation(() => {
        return new Error("The database is down!");
      });

    jest.spyOn(log, "error").mockImplementation(() => "Test error message");

    await deploymentCreated(message);

    expect(message.ack).toHaveBeenCalledTimes(0);
    expect(log.error).toHaveBeenCalledTimes(1);
  });
});
