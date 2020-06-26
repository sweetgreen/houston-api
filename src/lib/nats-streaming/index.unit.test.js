import { natsPubSub } from "./";

describe("nats-streaming", () => {
  let nc = {};

  afterAll(() => {
    nc.close();
  });

  test("nc on and publish exist", async () => {
    const clientID = "deployment-updated";
    const subject = "test-subject";
    const testFunc = () => {};
    nc = natsPubSub(clientID, subject, testFunc);
    const eventNames = nc.eventNames();

    expect(nc.on).toBeTruthy();
    expect(eventNames).toEqual(["connect"]);
  });
});