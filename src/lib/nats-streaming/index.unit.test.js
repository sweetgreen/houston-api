import { pubSub } from "./";

describe("nats-streaming", () => {
  const clientID = "deployment-updated";
  const subject = "test-subject";
  let nc = {};

  beforeEach(() => {
    const testFunc = () => {};
    nc = pubSub(clientID, subject, testFunc);
  });

  afterEach(() => {
    nc.close();
  });

  test("nc on error and connect exist", () => {
    const eventNames = nc.eventNames();
    const expectedEvents = [
      "error",
      "disconnect",
      "reconnecting",
      "connection_lost",
      "connect",
      "reconnect"
    ];

    expect(nc.on).toBeTruthy();
    expect(eventNames.sort()).toEqual(expectedEvents.sort());
  });

  test("error handlers log", () => {
    nc._events.error("Test Error Message");
    nc._events.disconnect();
  });

  test("reconnect attempt logs", () => {
    nc._events.reconnecting();
  });

  test("connection lost logs", () => {
    nc._events.connection_lost("Test Connection Lost Message");
  });

  test("Reconnects correctly", () => {
    const newNc = nc._events.reconnect(nc);
    // Close the new connection so the test suite does not fail
    newNc.close();
  });
});
