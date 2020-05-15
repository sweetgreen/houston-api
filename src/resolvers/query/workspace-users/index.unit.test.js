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
  query workspaceUsers(
    $workspaceUuid: Uuid!
    $user: UserSearch
  ) {
    workspaceUsers(
      workspaceUuid: $workspaceUuid,
      user: $user
    ) {
      id
      emails {
        address
      }
      fullName
      username
    }
  }
`;

describe("workspaceUsers", () => {
  // Mock up some db functions.
  const users = jest.fn();

  // Construct db object for context.
  const db = { query: { users } };

  test("typical request is successful", async () => {
    // Create vars.
    const vars = {
      workspaceUuid: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { db }, vars);
    expect(res.errors).toBeUndefined();
    expect(db.query.users.mock.calls).toHaveLength(1);
  });

  test("typical (single user) request is successful", async () => {
    // Create vars.
    const vars = {
      workspaceUuid: casual.uuid,
      user: {
        username: casual.username
      }
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { db }, vars);
    expect(res.errors).toBeUndefined();
    expect(users.mock.calls.length).toBe(1);
  });
});
