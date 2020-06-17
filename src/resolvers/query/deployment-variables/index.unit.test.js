import resolvers from "resolvers";
import casual from "casual";
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
  query deploymentVariables(
    $workspaceUuid: Uuid!
    $releaseName: String!
  ) {
    deploymentVariables(
      workspaceUuid: $workspaceUuid
      releaseName: $releaseName
    ) {
      key
      value
      isSecret
    }
  }
`;

describe("deploymentVariables", () => {
  test("typical request is successful", async () => {
    const user = {
      id: casual.uuid,
      roleBindings: [{ role: "SYSTEM_ADMIN" }]
    };

    // Mock up some db functions.
    const deployment = jest.fn().mockReturnValue({ id: casual.uuid });

    // Construct db object for context.
    const db = {
      query: {
        deployment
      }
    };

    // Create mock commander client.
    const commander = {
      request: jest.fn().mockReturnValue([{ id: casual.uuid }])
    };

    const vars = {
      workspaceUuid: casual.uuid,
      releaseName: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(
      schema,
      query,
      null,
      { db, commander, user },
      vars
    );
    expect(res.errors).toBeUndefined();
    expect(deployment.mock.calls.length).toBe(1);
  });
});
