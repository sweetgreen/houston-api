import deploymentImageUpdate, { helmUpdateDeployment } from "./index";
import { prisma } from "generated/client";
import casual from "casual";

jest.mock("generated/client", () => {
  return {
    __esModule: true,
    prisma: jest.fn().mockName("MockPrisma")
  };
});

describe("deployment image update worker", () => {
  const nc = deploymentImageUpdate;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    nc.close();
  });

  test("correctly sets up pubsub", async () => {
    const eventNames = nc.eventNames();

    expect(nc.on).toBeTruthy();
    expect(nc.close).toBeTruthy();
    expect(eventNames).toEqual(["connect"]);
  });

  test("correctly deploys and update", async () => {
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
    const data = JSON.stringify(fragment);
    const natsMessage = {
      getData: () => data,
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

    await helmUpdateDeployment(natsMessage);

    expect(natsMessage.ack).toHaveBeenCalledTimes(1);
  });
});
