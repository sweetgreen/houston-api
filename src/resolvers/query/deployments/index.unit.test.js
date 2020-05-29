import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const query = `
  query deployments {
    deployments {
      id
      label
      description
      type
      releaseName
      version
      workspace {
        id: uuid
      }
      urls {
        type
        url
      }
      createdAt
      updatedAt
      config
      env
      properties
    }
  }
`;

describe("deployments", () => {
  test("typical request is successful", async () => {
    const user = {
      id: casual.uuid,
      roleBindings: [{ role: "SYSTEM_ADMIN" }]
    };

    // Mock up some db functions.
    const findMany = jest.fn();

    // Construct db object for context.
    const prisma = {
      deployment: {
        findMany
      }
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma, user });
    expect(res.errors).toBeUndefined();
    expect(findMany.mock.calls.length).toBe(1);
  });
});
