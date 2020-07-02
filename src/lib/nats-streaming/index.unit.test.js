import { pubSub } from "./";

describe("nats-streaming", () => {
  let nc = {};

  afterAll(() => {
    nc.close();
  });

  test("nc on error and connect exist", async () => {
    const clientID = "deployment-updated";
    const subject = "test-subject";
    const testFunc = () => {};
    nc = await pubSub(clientID, subject, testFunc);
    const eventNames = nc.eventNames();

    expect(nc.on).toBeTruthy();
    expect(eventNames).toEqual(["error", "connect"]);
  });
});
