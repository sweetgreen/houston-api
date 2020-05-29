import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const query = `
  query workspaces {
    workspaces {
      users {
        id
      }
    }
  }
`;

describe("workspaces", () => {
  test("typical request is successful", async () => {
    // Const password = casual.password;
    // const hash = await bcrypt.hash(password, 10);
    const usr = {
      id: casual.uuid,
      roleBindings: [{ workspace: { id: casual.uuid } }]
    };

    // Mock up some db functions.
    const findMany = jest.fn().mockReturnValue([]);

    // Construct db object for context.
    const prisma = {
      workspace: {
        findMany
      }
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma, user: usr });
    expect(res.errors).toBeUndefined();
    expect(findMany.mock.calls.length).toBe(1);
  });
});
