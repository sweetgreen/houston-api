import resolvers from "resolvers";
import casual from "casual";
import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import { importSchema } from "graphql-import";
import { SYSTEM_ADMIN } from "constants";

// Import our application schema
const schema = makeExecutableSchema({
  typeDefs: importSchema("src/schema.graphql"),
  resolvers
});

// Define our mutation
const query = `
  mutation deleteSystemRoleBinding(
    $userId: ID!
    $role: Role!
  ) {
    deleteSystemRoleBinding(
      userId: $userId
      role: $role
    ) {
      id
    }
  }
`;

describe("deleteSystemRoleBinding", () => {
  test("correctly deletes a system role binding", async () => {
    // Mock up some db functions.
    const roleBindings = jest
      .fn()
      .mockReturnValue([{ role: "SYSTEM_ADMIN" }, { role: "SYSTEM_ADMIN" }]);
    const deleteRoleBinding = jest.fn();

    // Construct db object for context.
    const db = {
      query: { roleBindings },
      mutation: { deleteRoleBinding }
    };

    const vars = {
      userId: casual.uuid,
      role: SYSTEM_ADMIN
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { db }, vars);
    expect(res.errors).toBeUndefined();
  });

  test("throws error if the role binding does not exist", async () => {
    // Mock up some db functions.
    const roleBindings = jest.fn().mockReturnValue([]);
    const deleteRoleBinding = jest.fn();

    // Construct db object for context.
    const db = {
      query: { roleBindings },
      mutation: { deleteRoleBinding }
    };

    const vars = {
      userId: casual.uuid,
      role: SYSTEM_ADMIN
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { db }, vars);
    expect(res.errors).toHaveLength(1);
  });

  test("throws error if there are no other system admins", async () => {
    // Mock up some db functions.
    const roleBindings = jest.fn().mockReturnValue([{ role: "SYSTEM_ADMIN" }]);
    const deleteRoleBinding = jest.fn();

    // Construct db object for context.
    const db = {
      query: { roleBindings },
      mutation: { deleteRoleBinding }
    };

    const vars = {
      userId: casual.uuid,
      role: SYSTEM_ADMIN
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { db }, vars);
    expect(res.errors).toHaveLength(1);
  });
});
