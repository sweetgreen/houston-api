import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

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
  const findMany = jest.fn().mockReturnValue([
    {
      id: casual.uuid,
      createdAt: new Date(),
      updatedAt: new Date(),
      emails: [{ address: casual.email }]
    }
  ]);

  // Construct db object for context.
  const prisma = { user: { findMany } };

  test("typical request is successful", async () => {
    const vars = {
      workspaceUuid: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();
    expect(prisma.user.findMany.mock.calls).toHaveLength(1);
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
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();
    expect(prisma.user.findMany.mock.calls).toHaveLength(1);
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
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();
    expect(prisma.user.findMany.mock.calls.length).toBe(1);
  });
});
