import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import { DEPLOYMENT_ADMIN } from "constants";

// Define our mutation
const mutation = `
  mutation createDeploymentServiceAccount(
    $label: String!,
    $category: String,
    $deploymentUuid: Uuid!,
    $role: Role!
  ) {
    createDeploymentServiceAccount(
      label: $label,
      category: $category,
      deploymentUuid: $deploymentUuid,
      role: $role
    ) {
      id
      label
      apiKey
      entityType
      deploymentUuid
      category
      active
      lastUsedAt
      createdAt
      updatedAt
    }
  }
`;

describe("createDeploymentServiceAccount", () => {
  test("typical request is successful", async () => {
    const deploymentId = casual.uuid;

    // Create mock user.
    const user = {
      id: casual.uuid,
      username: casual.email,
      roleBindings: [
        {
          role: DEPLOYMENT_ADMIN,
          deployment: { id: deploymentId }
        }
      ]
    };

    // Create mock function.
    const create = jest.fn().mockReturnValue({
      id: casual.uuid,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Construct db object for context.
    const prisma = {
      serviceAccount: { create }
    };

    // Create variables.
    const vars = {
      label: casual.word,
      category: casual.word,
      deploymentUuid: deploymentId,
      role: DEPLOYMENT_ADMIN
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma, user }, vars);

    expect(res.errors).toBeUndefined();
    expect(create.mock.calls).toHaveLength(1);
  });
});
