import { schema } from "../../../schema";
import { graphql } from "graphql";
import casual from "casual";

// Define our mutation
const query = `
  query invites(
    $invite: InviteSearch
  ) {
    invites(
      invite: $invite
    ) {
      id: uuid
      email
      role
      createdAt
      updatedAt
    }
  }
`;

describe("invites", () => {
  // Mock up some db functions.
  const findMany = jest.fn();

  // Construct db object for context.
  const prisma = {
    inviteToken: { findMany }
  };

  test("typical request is successful", async () => {
    const res = await graphql(schema, query, null, { prisma });
    expect(res.errors).toBeUndefined();
    expect(prisma.inviteToken.findMany.mock.calls.length).toBe(1);
  });

  test("typical request (using ID) is successful", async () => {
    const vars = {
      invite: {
        inviteUuid: casual.uuid
      }
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();
    expect(prisma.inviteToken.findMany.mock.calls.length).toBe(1);
  });
});
