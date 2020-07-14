import nc, { deploymentVariablesUpdated } from "./index";
import { prisma } from "generated/client";
import commander from "commander";
import log from "logger";
import { generateReleaseName } from "deployments/naming";
import casual from "casual";

jest.mock("generated/client", () => {
  return {
    __esModule: true,
    prisma: jest.fn().mockName("MockPrisma")
  };
});

jest.mock("commander", () => {
  return {
    commander: jest.fn().mockName("MockCommander")
  };
});

describe("deployment variables updated worker", () => {
  const id = casual.uuid;
  const workspace = { id };
  const label = casual.word;
  const airflowVersion = "1.10.10";
  const releaseName = generateReleaseName();
  const environmentVariables = [
    {
      key: "KEY_1",
      value: "VAL_1",
      isSecret: true
    },
    {
      key: "KEY_2",
      value: "VAL_2",
      isSecret: false
    }
  ];
  const fragment = {
    workspace,
    label,
    id,
    environmentVariables,
    releaseName,
    airflowVersion
  };
  const data = JSON.stringify(fragment);
  const message = {
    getData: () => data,
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

  test("correctly updates environment variables", async () => {
    prisma.deployment = jest
      .fn()
      .mockName("deployment")
      .mockReturnValue({
        $fragment: () => {
          return fragment;
        }
      });
    commander.request = jest
      .fn()
      .mockName("request")
      .mockReturnValue(true);

    await deploymentVariablesUpdated(message);

    expect(commander.request).toHaveBeenCalledTimes(3);
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

    await deploymentVariablesUpdated(message);

    expect(message.ack).toHaveBeenCalledTimes(0);
    expect(log.error).toHaveBeenCalledTimes(1);
  });
});
