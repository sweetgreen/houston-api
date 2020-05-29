import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import { WORKSPACE_ADMIN } from "constants";

// Define our mutation
const mutation = `
  mutation updateServiceAccount(
    $serviceAccountUuid: Uuid!
    $payload: JSON!
  ) {
    updateServiceAccount(
      serviceAccountUuid: $serviceAccountUuid
      payload: $payload
    ) {
      id
      label
      apiKey
      entityType
      entityUuid
      category
      active
      lastUsedAt
      createdAt
      updatedAt
    }
  }
`;

describe("updateServiceAccount", () => {
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
      entityType: "someType",
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
      entityType: "someType",
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
