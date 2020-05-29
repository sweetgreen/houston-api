import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const query = `
  query users(
    $user: UserSearch
  ) {
    users(
      user: $user
    ) {
      id
      emails {
        address
        verified
        primary
      }
      fullName
      profile {
        key
        value
        category
      }
      username
      status
    }
  }
`;

describe("users", () => {
  const user = {
    id: casual.uuid,
    roleBindings: [{ deployment: { id: casual.uuid } }]
  };

  // Mock up some db functions.
  const findMany = jest.fn().mockReturnValue([
    {
      id: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      emails: [{ address: casual.email }],
      profile: [{ key: "test", value: "value" }]
    }
  ]);

  // Construct db object for context.
  const prisma = {
    user: { findMany }
  };

  test("typical request is successful", async () => {
    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma, user });
    expect(res.errors).toBeUndefined();
    expect(prisma.user.findMany.mock.calls.length).toBe(1);
  });

  test("typical single user request is successful", async () => {
    // Create vars.
    const vars = {
      user: {
        username: casual.username
      }
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();
    expect(prisma.user.findMany.mock.calls).toHaveLength(1);
  });
});
