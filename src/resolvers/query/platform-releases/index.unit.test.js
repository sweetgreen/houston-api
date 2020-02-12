import resolvers from "resolvers";
import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import { importSchema } from "graphql-import";

// Import our application schema
const schema = makeExecutableSchema({
  typeDefs: importSchema("src/schema.graphql"),
  resolvers
});

// Define our mutation
const query = `
  query updateAvailable {
    updateAvailable {
      version
    }
  }
`;

describe("updateAvailable", () => {
  test("when no updates available", async () => {
    // Mock up some db functions.
    const platformReleases = jest.fn();

    // Construct db object for context.
    const db = {
      query: {
        platformReleases
      }
    };

    // Run the graphql query.
    const res = await graphql(schema, query, null, { db });
    expect(res.errors).toBeUndefined();
    expect(platformReleases.mock.calls.length).toBe(1);
    expect(res.data).toHaveProperty("updateAvailable", null);
  });

  test("when there is an update available", async () => {
    const releases = [
      {
        version: "0.0.1",
        url: "https://astronomer.io/cea/release-notes/{new_version}.html",
        level: "bug_fix"
      },
      {
        version: "0.0.2",
        url: "https://astronomer.io/cea/release-notes/{new_version}.html",
        level: "bug_fix123"
      }
    ];

    // Construct db object for context.
    const db = {
      query: {
        platformReleases: jest.fn().mockReturnValue(releases)
      }
    };

    // Run the graphql query.
    const res = await graphql(schema, query, null, { db });
    expect(res.errors).toBeUndefined();
    expect(res.data.updateAvailable).toEqual({ version: "0.0.2" });
  });
});
