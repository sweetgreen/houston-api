import resolvers from "resolvers";
import * as validate from "service-accounts/existence";
import casual from "casual";
import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import { importSchema } from "graphql-import";
import { WORKSPACE_ADMIN } from "constants";

// Import our application schema
const schema = makeExecutableSchema({
  typeDefs: importSchema("src/schema.graphql"),
  resolvers
});

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

describe("updateDeploymentServiceAccount", () => {
  test("typical request is successful", async () => {
    jest.spyOn(validate, "default").mockReturnValue();

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
    const updateServiceAccount = jest.fn();

    // Construct db object for context.
    const db = {
      mutation: { updateServiceAccount }
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
    const res = await graphql(schema, mutation, null, { db, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(updateServiceAccount).toHaveBeenCalledTimes(1);
    expect(updateServiceAccount).toHaveBeenCalledWith(
      { where, data },
      expect.any(Object)
    );
  });

  test("invalid fields are ignored", async () => {
    jest.spyOn(validate, "default").mockReturnValue();

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
    const updateServiceAccount = jest.fn();

    // Construct db object for context.
    const db = {
      mutation: { updateServiceAccount }
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
    const res = await graphql(schema, mutation, null, { db, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(updateServiceAccount).toHaveBeenCalledTimes(1);
    expect(updateServiceAccount).toHaveBeenCalledWith(
      { where, data },
      expect.any(Object)
    );
  });
});
