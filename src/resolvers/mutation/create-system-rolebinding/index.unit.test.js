import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import { SYSTEM_ADMIN } from "constants";

// Define our mutation
const query = `
  mutation createSystemRoleBinding(
    $userId: ID!
    $role: Role!
  ) {
    createSystemRoleBinding(
      userId: $userId
      role: $role
    ) {
      id
    }
  }
`;

describe("createSystemRoleBinding", () => {
  test("correctly creates a system role binding", async () => {
    // Mock up some db functions.
    const findOne = jest.fn();
    const create = jest.fn().mockReturnValue({
      id: casual.uuid,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Construct db object for context.
    const prisma = {
      roleBinding: { findOne, create }
    };

    const vars = {
      userId: casual.uuid,
      role: SYSTEM_ADMIN
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();
  });

  test("throws error if role binding exists", async () => {
    // Mock up some db functions.
    const findOne = jest.fn().mockReturnValue(true);
    const create = jest.fn().mockReturnValue({
      id: casual.uuid,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Construct db object for context.
    const prisma = {
      roleBinding: { findOne, create }
    };

    const vars = {
      userId: casual.uuid,
      role: "BAD_ROLE"
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toHaveLength(1);
  });
});
