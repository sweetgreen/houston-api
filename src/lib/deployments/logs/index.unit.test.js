import {
  createLogQuery,
  generateLogMessage,
  generateMockLogRecords,
  formatLogDocument,
  search
} from "./index";
import sampleLogs from "./sample";

describe("deployments logs", () => {
  describe("generateLogMessage", () => {
    test("correctly iterates over sample logs", () => {
      const expected = sampleLogs;
      const actual = new Array();

      expected.forEach(() => {
        actual.push(generateLogMessage.next().value);
      });

      expect(actual).toStrictEqual(expected);
    });
  });

  describe("generateMockLogRecords", () => {
    test("correctly iterates over sample logs", () => {
      const uuidMatcher = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const date = new Date();
      const name = "Test Name";
      const component = "Test Component";
      jest.spyOn(global, "Date").mockImplementation(() => date);
      const actual = generateMockLogRecords(name, component);
      const hits = actual.hits.hits;
      const expectedMessages = sampleLogs;

      for (let i = 0; i < hits.length; i++) {
        const { _id, _source } = hits[i];
        expect(_source.release).toEqual(name);
        expect(_source.component).toEqual(component);
        expect(_source.message).toEqual(expectedMessages[i]);
        expect(_source["@timestamp"]).toEqual(date);
        expect(uuidMatcher.test(_id)).toEqual(true);
      }
    });
  });

  describe("createLogQuery", () => {
    test("correctly creates query using only release name", () => {
      const query = createLogQuery("planetary-nebula-1234");
      const must = query.body.query.bool.must;

      expect(must).toHaveLength(1);
    });

    test("skips a search phrase if not specified", () => {
      const query = createLogQuery(
        "planetary-nebula-1234",
        "webserver",
        new Date()
      );
      const must = query.body.query.bool.must;
      expect(must).toHaveLength(2);
    });

    test("correctly merges a query if a searchPhrase is specified", () => {
      const query = createLogQuery(
        "planetary-nebula-1234",
        "webserver",
        new Date(),
        "blah"
      );
      const must = query.body.query.bool.must;
      expect(must).toHaveLength(3);
    });
  });

  describe("search", () => {
    test("development mode returns mock records", async () => {
      const name = "A Release Name";
      const component = "A Release Component";
      const res = await search(name, component);
      const hits = res.hits.hits;

      for (let i = 0; i < hits.length; i++) {
        const hit = hits[i];

        expect(name).toBe(hit._source.release);
        expect(component).toBe(hit._source.component);
      }
    });
  });

  describe("formatLogDocument", () => {
    test("correctly formats elastic search document", async () => {
      const name = "Test Name";
      const component = "Test Component";
      const actual = generateMockLogRecords(name, component);
      const hits = actual.hits.hits;

      for (let i = 0; i < hits.length; i++) {
        const hit = hits[i];
        const { _id, _source } = hit;
        const expected = {
          id: _id,
          component: _source.component,
          release: _source.release,
          timestamp: _source["@timestamp"],
          message: _source.message
        };
        const actual = formatLogDocument(hit);

        expect(actual).toStrictEqual(expected);
      }
    });
  });
});
