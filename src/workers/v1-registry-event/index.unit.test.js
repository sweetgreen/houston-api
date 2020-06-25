import { helmUpdateDeployment } from "./index";
import { prisma } from "generated/client";
import casual from "casual";

jest.mock("generated/client", () => {
  return {
    __esModule: true,
    commander: jest.fn().mockName("MockCommander"),
    prisma: jest.fn().mockName("MockPrisma"),
    natsFactory: jest.fn().mockName("MockNatsFactory")
  };
});

describe("v1-registry-event worker", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("updated deployment in worker", async () => {
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
        $fragment: function() {
          return fragment;
        }
      });

    await helmUpdateDeployment(natsMessage);

    expect(natsMessage.ack).toHaveBeenCalledTimes(1);
  });
});
