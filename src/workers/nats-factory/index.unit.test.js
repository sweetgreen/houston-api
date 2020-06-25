import { natsFactory } from "./";

describe("natsFactory", () => {
  let nc = {};

  afterAll(() => {
    nc.close();
  });
  test("nc on and publish exist", () => {
    const clusterID = "test-cluster";
    const clientID = "deployment-updated";
    const subject = "test-subject";
    const testFunc = () => jest.fn().mockName("testFunc");

    nc = natsFactory(clusterID, clientID, subject, testFunc);
    const eventNames = nc.eventNames();

    expect(nc.on).toBeTruthy();
    expect(eventNames).toEqual(["connect"]);
  });
});
