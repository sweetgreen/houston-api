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
  query users(
    $user: UserSearch
  ) {
    users(
      user: $user
    ) {
      id
      emails {
        address
        verified
        primary
      }
      fullName
      profile {
        key
        value
        category
      }
      username
      status
    }
  }
`;

describe("users", () => {
  const user = {
    id: casual.uuid,
    roleBindings: [{ deployment: { id: casual.uuid } }]
  };

  // Mock up some db functions.
  const users = jest.fn();

  // Construct db object for context.
  const db = { query: { users } };

  test("typical request is successful", async () => {
    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { db, user });
    expect(res.errors).toBeUndefined();
    expect(users.mock.calls.length).toBe(1);
  });

  test("typical single user request is successful", async () => {
    // Create vars.
    const vars = {
      user: {
        username: casual.username
      }
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { db, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(users.mock.calls.length).toBe(1);
  });
});
