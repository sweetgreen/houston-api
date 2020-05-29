import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import { WORKSPACE_ADMIN } from "constants";

// Define our mutation
const mutation = `
  mutation updateDeploymentServiceAccount(
    $serviceAccountUuid: Uuid!
    $deploymentUuid: Uuid!
    $payload: JSON!
  ) {
    updateDeploymentServiceAccount(
      serviceAccountUuid: $serviceAccountUuid
      deploymentUuid: $deploymentUuid
      payload: $payload
    ) {
      id
      label
      apiKey
      deploymentUuid
      category
      active
      lastUsedAt
      createdAt
      updatedAt
    }
  }
`;

describe("updateDeploymentServiceAccount", () => {
  test("typical request is successful", async () => {
    const workspaceId = casual.uuid;
    const serviceAccountId = casual.uuid;
    const label = casual.title;

    // Mock up a user.
    const user = {
      id: casual.uuid,
      roleBindings: [
        {
          role: WORKSPACE_ADMIN,
          workspace: { id: workspaceId }
        }
      ]
    };

    // Mock up some functions.
    const update = jest.fn().mockReturnValue({
      id: casual.uuid,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Construct db object for context.
    const prisma = {
      serviceAccount: { update }
    };

    // Vars for the gql mutation.
    const vars = {
      serviceAccountUuid: serviceAccountId,
      deploymentUuid: workspaceId,
      payload: {
        label
      }
    };

    const where = { id: serviceAccountId };
    const data = { label };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({ where, data });
  });

  test("invalid fields are ignored", async () => {
    const workspaceId = casual.uuid;
    const serviceAccountId = casual.uuid;
    const label = casual.title;
    const invalidField = casual.title;

    // Mock up a user.
    const user = {
      id: casual.uuid,
      roleBindings: [
        {
          role: WORKSPACE_ADMIN,
          workspace: { id: workspaceId }
        }
      ]
    };

    // Mock up some functions.
    const update = jest.fn().mockReturnValue({
      id: casual.uuid,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Construct db object for context.
    const prisma = {
      serviceAccount: { update }
    };

    // Vars for the gql mutation.
    const vars = {
      serviceAccountUuid: serviceAccountId,
      deploymentUuid: workspaceId,
      payload: {
        label,
        invalidField
      }
    };

    const where = { id: serviceAccountId };
    const data = { label };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({ where, data });
  });
});
