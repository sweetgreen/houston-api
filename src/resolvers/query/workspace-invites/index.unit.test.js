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
  query workspaceInvites(
    $workspaceUuid: Uuid!
    $invite: InviteSearch
  ) {
    workspaceInvites(
      workspaceUuid: $workspaceUuid
      invite: $invite
    ) {
      id
      email
      token
      createdAt
      updatedAt
    }
  }
`;

describe("invites", () => {
  // Mock up some db functions.
  const inviteTokens = jest.fn();

  // Construct db object for context.
  const db = {
    query: {
      inviteTokens
    }
  };

  test("typical request is successful", async () => {
    const vars = {
      workspaceUuid: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { db }, vars);
    expect(res.errors).toBeUndefined();
    expect(inviteTokens.mock.calls.length).toBe(1);
  });

  test("typical request (by email) is successful", async () => {
    const vars = {
      workspaceUuid: casual.uuid,
      invite: {
        email: casual.email
      }
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { db }, vars);
    expect(res.errors).toBeUndefined();
    expect(inviteTokens.mock.calls.length).toBe(1);
  });

  test("typical request (by ID) is successful", async () => {
    const vars = {
      workspaceUuid: casual.uuid,
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
