import { deploymentsQuery } from "./index";
import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const query = `
  query deployments(
    $workspaceUuid: Uuid!
  ) {
    workspaceDeployments(
      workspaceUuid: $workspaceUuid
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
      roleBindings: [{ deployment: { id: casual.uuid } }]
    };

    // Mock up some db functions.
    const findMany = jest.fn();

    // Construct db object for context.
    const prisma = {
      deployment: {
        findMany
      }
    };

    // Vars for the gql mutation.
    const vars = { workspaceUuid: casual.uuid };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(findMany.mock.calls.length).toBe(1);
  });
});

describe("deploymentsQuery", () => {
  test("workspaceId is correctly used in query", async () => {
    const workspaceId = casual.uuid;

    const args = {
      workspaceUuid: workspaceId
    };

    const user = {
      id: casual.uuid
    };

    // Build context.
    const ctx = { user };

    // Get the query.
    const query = deploymentsQuery(args, ctx);

    expect(query).toHaveProperty("where.AND");
    expect(query.where.AND).toHaveLength(2);
    expect(query.where.AND[0]).toHaveProperty("workspace.id", workspaceId);
    expect(query.where.AND[1]).toHaveProperty("deletedAt", null);
  });

  test("correctly falls back if no arguments are provided", async () => {
    const deploymentId1 = casual.uuid;
    const deploymentId2 = casual.uuid;

    const args = {};

    const user = {
      id: casual.uuid,
      roleBindings: [
        { deployment: { id: deploymentId1 } },
        { deployment: { id: deploymentId2 } }
      ]
    };

    // Build context.
    const ctx = { user };

    // Run the graphql mutation.
    const query = deploymentsQuery(args, ctx);

    expect(query).toHaveProperty("where.AND");
    expect(query.where.AND).toHaveLength(2);
    expect(query.where.AND[0]).toStrictEqual({
      id: { in: [deploymentId1, deploymentId2] }
    });
    expect(query.where.AND[1]).toHaveProperty("deletedAt", null);
  });
});
