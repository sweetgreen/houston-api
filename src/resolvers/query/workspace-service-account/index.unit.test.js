import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import { WORKSPACE_ADMIN } from "constants";

// Define our mutation
const query = `
  query workspaceServiceAccount(
    $workspaceUuid: Uuid!
    $serviceAccountUuid: Uuid!
  ) {
    workspaceServiceAccount(
      workspaceUuid: $workspaceUuid
      serviceAccountUuid: $serviceAccountUuid
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

describe("workspaceServiceAccount", () => {
  test("typical request is successful", async () => {
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

    // Mock up some db functions.
    const findOne = jest.fn();

    // Construct db object for context.
    const prisma = {
      serviceAccount: { findOne }
    };

    const vars = {
      workspaceUuid: user.roleBindings[0].workspace.id,
      serviceAccountUuid: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(findOne).toHaveBeenCalledTimes(1);
  });

  test("request fails if missing an argument", async () => {
    // Run the graphql mutation.
    const res = await graphql(schema, query, null, {}, {});
    expect(res.errors).toHaveLength(2);
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
      workspaceUuid: user.roleBindings[0].workspace.id,
      serviceAccountUuid: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { user }, vars);
    expect(res.errors).toHaveLength(1);
  });
});
