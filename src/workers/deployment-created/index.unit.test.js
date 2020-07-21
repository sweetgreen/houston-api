import nc, { deploymentCreated } from "./index";
import { prisma } from "generated/client";
import { generateReleaseName } from "deployments/naming";
import bcrypt from "bcryptjs";
import casual from "casual";
import { DEPLOYMENT_CREATED_ID } from "constants";

jest.mock("generated/client", () => {
  return {
    __esModule: true,
    prisma: jest.fn().mockName("MockPrisma")
  };
});

jest.mock("bcryptjs", () => {
  return {
    bcrypt: {
      hash: jest.fn().mockName("MockBcryptHash")
    }
  };
});

describe("deployment created worker", () => {
  const id = casual.uuid;
  const workspace = { id };
  const label = casual.word;
  const airflowVersion = "1.10.10";
  const releaseName = generateReleaseName();
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
    expect(nc.clientID).toEqual(DEPLOYMENT_CREATED_ID);
    expect(eventNames.sort()).toEqual(expectedEvents.sort());
  });

  test("correctly created deployment", async () => {
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
            airflowVersion: "1.10.10",
            releaseName
          };
        }
      });

    bcrypt.hash = jest.fn().mockReturnValue(() => {
      return "hashed string";
    });

    await deploymentCreated(message);

    expect(message.ack).toHaveBeenCalledTimes(1);
  });
});
