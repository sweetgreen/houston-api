import resolvers from "resolvers";
import { graphql } from "graphql";
import casual from "casual";
import { makeExecutableSchema } from "graphql-tools";
import { importSchema } from "graphql-import";

// Import our application schema
const schema = makeExecutableSchema({
  typeDefs: importSchema("src/schema.graphql"),
  resolvers
});

// Define our mutation
const query = `
  query invites(
    $invite: InviteSearch
  ) {
    invites(
      invite: $invite
    ) {
      id
      email
      role
      createdAt
      updatedAt
    }
  }
`;

describe("invites", () => {
  // Mock up some db functions.
  const inviteTokens = jest.fn();

  // Construct db object for context.
  const db = { query: { inviteTokens } };

  test("typical request is successful", async () => {
    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { db });
    expect(res.errors).toBeUndefined();
    expect(inviteTokens.mock.calls.length).toBe(1);
  });

  test("typical request (using ID) is successful", async () => {
    const vars = {
      invite: {
        inviteUuid: casual.uuid
      }
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { db }, vars);
    expect(res.errors).toBeUndefined();
    expect(inviteTokens.mock.calls.length).toBe(1);
  });
});
