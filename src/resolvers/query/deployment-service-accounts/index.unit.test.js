import resolvers from "resolvers";
import casual from "casual";
import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import { importSchema } from "graphql-import";
import { DEPLOYMENT_ADMIN } from "constants";

// Import our application schema
const schema = makeExecutableSchema({
  typeDefs: importSchema("src/schema.graphql"),
  resolvers
});

// Define our mutation
const query = `
  query deploymentServiceAccounts(
    $deploymentUuid: Uuid!
  ) {
    deploymentServiceAccounts(
      deploymentUuid: $deploymentUuid
    ) {
      id
    }
  }
`;

describe("deploymentServiceAccounts", () => {
  test("typical request is successful", async () => {
    const deployment = casual.uuid;

    // Create mock user.
    const user = {
      id: casual.uuid,
      username: casual.email,
      roleBindings: [
        {
          role: DEPLOYMENT_ADMIN,
          deployment: { id: deployment }
        }
      ]
    };

    // Mock up some db functions.
    const serviceAccounts = jest.fn();

    // Construct db object for context.
    const db = {
      query: { serviceAccounts }
    };

    const vars = {
      deploymentUuid: deployment
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { db, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(serviceAccounts.mock.calls.length).toBe(1);
  });

  test("request fails if missing an argument", async () => {
    // Run the graphql mutation.
    const res = await graphql(schema, query, null, {}, {});
    expect(res.errors).toHaveLength(1);
  });

  test("request fails if user does not have access to deploymentUuid", async () => {
    // Create mock user.
    const user = {
      id: casual.uuid,
      username: casual.email,
      roleBindings: [
        {
          role: DEPLOYMENT_ADMIN,
          deployment: { id: casual.uuid }
        }
      ]
    };

    const vars = {
      deploymentUuid: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { user }, vars);
    expect(res.errors).toHaveLength(1);
  });
});
