import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import { WORKSPACE_ADMIN } from "constants";

// Define our mutation
const mutation = `
  mutation createWorkspaceServiceAccount(
    $label: String!,
    $category: String,
    $workspaceUuid: Uuid!,
    $role: Role!
  ) {
    createWorkspaceServiceAccount(
      label: $label,
      category: $category,
      workspaceUuid: $workspaceUuid,
      role: $role
    ) {
      id
      label
      apiKey
      workspaceUuid
      category
      active
      lastUsedAt
      createdAt
      updatedAt
    }
  }
`;

describe("createWorkspaceServiceAccount", () => {
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
      updatedAt: new Date(),
      roleBinding: {
        workspace: { id: casual.uuid }
      }
    });

    // Construct db object for context.
    const prisma = { serviceAccount: { create } };

    // Create variables.
    const vars = {
      label: casual.word,
      category: casual.word,
      workspaceUuid: workspaceId,
      role: WORKSPACE_ADMIN
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma, user }, vars);

    expect(res.errors).toBeUndefined();
    expect(create.mock.calls).toHaveLength(1);
  });
});
