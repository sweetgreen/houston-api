import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import { ENTITY_WORKSPACE, WORKSPACE_ADMIN } from "constants";

// Define our mutation
const query = `
  query serviceAccounts(
    $serviceAccountUuid: Uuid
    $entityType: EntityType!
    $entityUuid: Uuid
  ) {
    serviceAccounts(
      serviceAccountUuid: $serviceAccountUuid
      entityType: $entityType
      entityUuid: $entityUuid
    ) {
      id
      label
      apiKey
      entityType
      entityId: entityUuid
      category
      active
      lastUsedAt
      createdAt
      updatedAt
    }
  }
`;

describe("serviceAccounts", () => {
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
      entityType: ENTITY_WORKSPACE,
      entityUuid: workspaceId
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(findMany.mock.calls.length).toBe(1);
  });

  test("request fails if missing an argument", async () => {
    const vars = {
      entityType: ENTITY_WORKSPACE
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, {}, vars);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].message).toEqual(
      expect.stringMatching(/^A required argument was not sent/)
    );
  });

  test("request fails if user does not have access to entityUuid", async () => {
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
      entityType: ENTITY_WORKSPACE,
      entityUuid: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { user }, vars);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].message).toEqual(
      expect.stringMatching(/^You do not have the appropriate permissions/)
    );
  });
});
