import { schema } from "../../../schema";
import { graphql } from "graphql";

// Define our query
const query = `
  query config {
    appConfig {
      version
      baseDomain
    }
  }
`;

describe("appConfig", () => {
  test("typical request is successful", async () => {
    // Construct db object for context.
    const prisma = {};

    // Run the graphql mutation.
    await graphql(schema, query, null, { prisma });
  });
});
