import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import { ENTITY_WORKSPACE, WORKSPACE_ADMIN } from "constants";

// Define our mutation
const mutation = `
  mutation createServiceAccount(
    $label: String!,
    $category: String,
    $entityType: EntityType!,
    $entityUuid: Uuid,
    $role: Role!
  ) {
    createServiceAccount(
      label: $label,
      category: $category,
      entityType: $entityType,
      entityUuid: $entityUuid,
      role: $role
    ) {
      id
      label
      apiKey
      entityType
      entityUuid
      category
      active
      lastUsedAt
      createdAt
      updatedAt
    }
  }
`;

describe("createServiceAccount", () => {
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

    // Create mock function.
    const create = jest.fn().mockReturnValue({
      id: casual.uuid,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Construct db object for context.
    const prisma = {
      serviceAccount: { create }
    };

    // Create variables.
    const vars = {
      label: casual.word,
      category: casual.word,
      entityType: ENTITY_WORKSPACE,
      entityUuid: workspaceId,
      role: WORKSPACE_ADMIN
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma, user }, vars);

    expect(res.errors).toBeUndefined();
    expect(create.mock.calls).toHaveLength(1);
  });

  test("error is thrown if passing entityUuid and does not have access", async () => {
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

    // Create mock function.
    const create = jest.fn().mockReturnValue({
      id: casual.uuid,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Construct db object for context.
    const prisma = {
      serviceAccount: { create }
    };

    // Create variables.
    const vars = {
      label: casual.word,
      category: casual.word,
      entityType: ENTITY_WORKSPACE,
      entityUuid: casual.uuid,
      role: WORKSPACE_ADMIN
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma, user }, vars);

    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].message).toEqual(
      expect.stringMatching(/^You do not have the appropriate permissions/)
    );
    expect(create.mock.calls).toHaveLength(0);
  });
});
