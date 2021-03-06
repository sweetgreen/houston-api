import { pubSub, publisher } from "./";

describe("nats-streaming", () => {
  describe("pubSub", () => {
    const clientID = "test-client-id";
    const subject = "test-subject";
    const testFunc = () => {};
    let nc = {};

    beforeEach(() => {
      nc = pubSub(clientID, subject, testFunc);
    });

    afterEach(() => {
      nc.close();
    });

    test("correct events exist", () => {
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
      expect(eventNames.sort()).toEqual(expectedEvents.sort());
    });

    test("connect attaches subscribe correctly", () => {
      nc._events.connect();
    });

    test("error handlers log", () => {
      nc._events.error("Test Error Message");
      nc._events.disconnect();
    });

    test("reconnecting attempt logs", () => {
      nc._events.reconnecting();
    });

    test("connection lost logs", () => {
      nc._events.connection_lost("Test Connection Lost Message");
    });

    test("reconnects correctly", () => {
      const newNc = nc._events.reconnect(nc);
      // Close the new connection so the test suite does not fail
      newNc.close();
    });
  });

  describe("publisher", () => {
    const clientID = "test-client-id";
    const subject = "test-subject";
    const testFunc = () => {};
    let nc = {};

    describe("implements correct", () => {
      beforeEach(() => {
        nc = publisher(clientID, subject, testFunc);
      });

      afterEach(() => {
        nc.close();
      });

      test("events names", () => {
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
        expect(eventNames.sort()).toEqual(expectedEvents.sort());
      });

      test("logs for connect", () => {
        nc._events.connect();
      });

      test("logs for error handler", () => {
        nc._events.error("Test Error Message");
        nc._events.disconnect();
      });

      test("logs for reconnecting", () => {
        nc._events.reconnecting();
      });

      test("logs for connection lost", () => {
        nc._events.connection_lost("Test Connection Lost Message");
      });

      test("reconnection method", () => {
        const newNc = nc._events.reconnect(nc);
        // Close the new connection so the test suite does not fail
        newNc.close();
      });

      test("on close error logging", () => {
        nc._events.close("Testing close error");
      });
    });
  });
});
