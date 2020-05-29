import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const query = `
  query workspaceDeployment (
    $workspaceUuid: Uuid!
    $releaseName: String!
  ) {
    workspaceDeployment (
      workspaceUuid: $workspaceUuid
      releaseName: $releaseName
    ) {
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
    const findOne = jest.fn();

    // Construct db object for context.
    const prisma = {
      deployment: {
        findOne
      }
    };

    // Query vars
    const vars = {
      workspaceUuid: casual.uuid,
      releaseName: casual.word
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(findOne.mock.calls.length).toBe(1);
  });
});
