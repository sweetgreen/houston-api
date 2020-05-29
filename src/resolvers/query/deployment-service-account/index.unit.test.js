import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import { DEPLOYMENT_ADMIN } from "constants";

// Define our mutation
const query = `
  query deploymentServiceAccount(
    $deploymentUuid: Uuid!
    $serviceAccountUuid: Uuid!
  ) {
    deploymentServiceAccount(
      deploymentUuid: $deploymentUuid
      serviceAccountUuid: $serviceAccountUuid
    ) {
      id
    }
  }
`;

describe("deploymentServiceAccount", () => {
  test("typical request is successful", async () => {
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

    // Mock up some db functions.
    const findOne = jest.fn().mockReturnValue({ id: casual.uuid });

    // Construct db object for context.
    const prisma = {
      serviceAccount: { findOne }
    };

    const vars = {
      deploymentUuid: user.roleBindings[0].deployment.id,
      serviceAccountUuid: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(findOne.mock.calls.length).toBe(1);
  });

  test("request fails if missing an argument", async () => {
    // Run the graphql mutation.
    const res = await graphql(schema, query, null, {}, {});
    expect(res.errors).toHaveLength(2);
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
      deploymentUuid: user.roleBindings[0].deployment.id,
      serviceAccountUuid: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { user }, vars);
    expect(res.errors).toHaveLength(1);
  });
});
