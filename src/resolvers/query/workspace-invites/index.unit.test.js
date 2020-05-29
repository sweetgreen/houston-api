import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

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
  const findMany = jest.fn();

  // Construct db object for context.
  const prisma = {
    inviteToken: {
      findMany
    }
  };

  test("typical request is successful", async () => {
    const vars = {
      workspaceUuid: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();
    expect(prisma.inviteToken.findMany.mock.calls.length).toBe(1);
  });

  test("typical request (by ID) is successful", async () => {
    const vars = {
      workspaceUuid: casual.uuid,
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
