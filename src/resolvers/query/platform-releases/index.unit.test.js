import { schema } from "../../../schema";
import { graphql } from "graphql";

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
    const findMany = jest.fn();

    // Construct db object for context.
    const prisma = {
      platformRelease: {
        findMany
      }
    };

    // Run the graphql query.
    const res = await graphql(schema, query, null, { prisma });
    expect(res.errors).toBeUndefined();
    expect(findMany.mock.calls.length).toBe(1);
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
    const prisma = {
      platformRelease: {
        findMany: jest.fn().mockReturnValue(releases)
      }
    };

    // Run the graphql query.
    const res = await graphql(schema, query, null, { prisma });
    expect(res.errors).toBeUndefined();
    expect(res.data.updateAvailable).toEqual({ version: "0.0.2" });
  });
});
