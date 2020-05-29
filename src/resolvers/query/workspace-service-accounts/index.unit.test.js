import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import { WORKSPACE_ADMIN } from "constants";

// Define our mutation
const query = `
  query workspaceServiceAccounts(
    $workspaceUuid: Uuid!
  ) {
    workspaceServiceAccounts(
      workspaceUuid: $workspaceUuid
    ) {
      id
      label
      apiKey
      entityType
      entityId: workspaceUuid
      category
      active
      lastUsedAt
      createdAt
      updatedAt
    }
  }
`;

describe("workspaceServiceAccounts", () => {
  test("typical request is successful", async () => {
    const workspaceId = casual.uuid;

    // Create mock user.
    const user = {
      id: casual.uuid,
      username: casual.email,
      roleBindings: [
        {
          role: WORKSPACE_ADMIN,
          workspace: { id: workspaceId }
        }
      ]
    };

    // Mock up some db functions.
    const findMany = jest.fn();

    // Construct db object for context.
    const prisma = {
      serviceAccount: { findMany }
    };

    const vars = {
      workspaceUuid: workspaceId
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(findMany.mock.calls.length).toBe(1);
  });

  test("request fails if missing an argument", async () => {
    // Run the graphql mutation.
    const res = await graphql(schema, query, null, {}, {});
    expect(res.errors).toHaveLength(1);
  });

  test("request fails if user does not have access to workspaceUuid", async () => {
    // Create mock user.
    const user = {
      id: casual.uuid,
      username: casual.email,
      roleBindings: [
        {
          role: WORKSPACE_ADMIN,
          workspace: { id: casual.uuid }
        }
      ]
    };

    const vars = {
      workspaceUuid: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { user }, vars);
    expect(res.errors).toHaveLength(1);
  });
});
