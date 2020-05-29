import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import { DEPLOYMENT_ADMIN } from "constants";

// Define our mutation
const query = `
  query deploymentServiceAccounts(
    $deploymentUuid: Uuid!
  ) {
    deploymentServiceAccounts(
      deploymentUuid: $deploymentUuid
    ) {
      id
    }
  }
`;

describe("deploymentServiceAccounts", () => {
  test("typical request is successful", async () => {
    const deployment = casual.uuid;

    // Create mock user.
    const user = {
      id: casual.uuid,
      username: casual.email,
      roleBindings: [
        {
          role: DEPLOYMENT_ADMIN,
          deployment: { id: deployment }
        }
      ]
    };

    // Mock up some db functions.
    const findMany = jest.fn();

    // Construct db object for context.
    const prisma = {
      serviceAccount: { findMany }
    };

    const vars = {
      deploymentUuid: deployment
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(findMany.mock.calls.length).toBe(1);
  });

  test("request fails if missing an argument", async () => {
    // Run the graphql mutation.
    const res = await graphql(schema, query, null, {}, {});
    expect(res.errors).toHaveLength(1);
  });

  test("request fails if user does not have access to deploymentUuid", async () => {
    // Create mock user.
    const user = {
      id: casual.uuid,
      username: casual.email,
      roleBindings: [
        {
          role: DEPLOYMENT_ADMIN,
          deployment: { id: casual.uuid }
        }
      ]
    };

    const vars = {
      deploymentUuid: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { user }, vars);
    expect(res.errors).toHaveLength(1);
  });
});
