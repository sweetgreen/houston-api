import nc, { deploymentDeleted } from "./index";
import { prisma } from "generated/client";
import log from "logger";
import casual from "casual";
import { DEPLOYMENT_DELETED_ID } from "constants";

jest.mock("generated/client", () => {
  return {
    __esModule: true,
    prisma: jest.fn().mockName("MockPrisma")
  };
});

describe("deployment deleted worker", () => {
  const id = casual.uuid;
  const workspace = { id };
  const label = casual.word;
  const airflowVersion = "1.10.10";
  const fragment = {
    workspace,
    label,
    id,
    airflowVersion
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

  test("correctly set up pubsub", async () => {
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
    expect(nc.clientID).toEqual(DEPLOYMENT_DELETED_ID);
    expect(eventNames.sort()).toEqual(expectedEvents.sort());
  });

  test("correctly deletes deployment", async () => {
    prisma.deployment = jest
      .fn()
      .mockName("deployment")
      .mockReturnValue({
        $fragment: () => {
          return fragment;
        }
      });

    await deploymentDeleted(message);

    expect(message.ack).toHaveBeenCalledTimes(1);
  });

  test("correctly throw error when database is down", async () => {
    prisma.deployment = jest
      .fn()
      .mockName("deployment")
      .mockImplementation(() => {
        throw new Error("The database is down!");
      });

    jest.spyOn(log, "error").mockImplementation(() => "Test error message");

    await deploymentDeleted(message);

    expect(message.ack).toHaveBeenCalledTimes(0);
    expect(log.error).toHaveBeenCalledTimes(1);
  });
});
