import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import { SYSTEM_ADMIN, WORKSPACE_ADMIN } from "constants";

// Define our mutation
const mutation = `
  mutation createSystemServiceAccount(
    $label: String!,
    $category: String,
    $role: Role!
  ) {
    createSystemServiceAccount(
      label: $label,
      category: $category,
      role: $role
    ) {
      id
      label
      apiKey
      entityType
      workspaceUuid
      category
      active
      lastUsedAt
      createdAt
      updatedAt
    }
  }
`;

describe("createSystemServiceAccount", () => {
  test("typical request is successful", async () => {
    // Create mock user.
    const user = {
      id: casual.uuid,
      username: casual.email,
      roleBindings: [
        {
          role: SYSTEM_ADMIN
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
      role: SYSTEM_ADMIN
    };

    const data = {
      active: true,
      apiKey: expect.anything(),
      category: vars.category,
      label: vars.label,
      roleBinding: {
        create: { role: SYSTEM_ADMIN }
      }
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma, user }, vars);

    expect(res.errors).toBeUndefined();
    expect(create).toBeCalledWith(expect.objectContaining({ data }));
    expect(create.mock.calls).toHaveLength(1);
  });

  test("request throws if requested role is invaid", async () => {
    // Create the mock user
    const user = {
      id: casual.uuid,
      username: casual.email,
      roleBindings: [
        {
          role: SYSTEM_ADMIN
        }
      ]
    };

    // Mock up some db functions.
    const create = jest.fn();
    // Construct db object for context.
    const prisma = {
      serviceAccount: { create }
    };

    const vars = {
      label: casual.word,
      category: casual.word,
      role: WORKSPACE_ADMIN
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma, user }, vars);
    expect(res.errors).toHaveLength(1);
    expect(create).toHaveBeenCalledTimes(0);
  });
});
