import { pubSub } from "./";

describe("nats-streaming", () => {
  const clientID = "deployment-updated";
  const subject = "test-subject";
  let nc = {};

  beforeEach(() => {
    const testFunc = () => {};
    nc = pubSub(clientID, subject, testFunc);
  });

  afterAll(() => {
    nc.close();
    nc = {};
  });

  test("nc on error and connect exist", () => {
    const eventNames = nc.eventNames();

    expect(nc.on).toBeTruthy();
    expect(eventNames).toEqual([
      "error",
      "disconnect",
      "reconnecting",
      "connect",
      "reconnect",
      "connection_lost"
    ]);
  });

  test("error handlers log", () => {
    nc.errorHandler("Test Error Handler");
    nc.disconnectHandler();
  });

  test("reconnect attempt logs", () => {
    nc.reconnectingHandler();
  });

  test("connection lost logs", () => {
    nc.connectionLostHandler("Test Connection Lost");
  });

  test("Reconnects correctly", () => {
    nc.subscribe = jest.fn().mockImplementation(() => {
      return {
        on: jest.fn().mockReturnValue(true),
        close: jest.fn().mockReturnValue(true),
        isClosed: jest.fn().mockReturnValue(true),
        unsubscribe: jest.fn().mockReturnValue(true)
      };
    });
    nc.connectHandler();
    nc.reconnectHandler(nc);
  });
});
