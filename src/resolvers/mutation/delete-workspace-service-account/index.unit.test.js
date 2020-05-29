import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import { WORKSPACE_ADMIN } from "constants";

// Define our mutation
const query = `
  mutation deleteWorkspaceServiceAccount(
    $serviceAccountUuid: Uuid!
    $workspaceUuid: Uuid!
  ) {
    deleteWorkspaceServiceAccount(
      serviceAccountUuid: $serviceAccountUuid
      workspaceUuid: $workspaceUuid
    ) {
      id
    }
  }
`;

describe("deleteWorkspaceServiceAccount", () => {
  test("typical request is successful", async () => {
    // Create mock user.
    const workspaceId = casual.uuid;
    const id = casual.uuid;

    const user = {
      id: casual.uuid,
      username: casual.email,
      roleBindings: [
        {
          role: WORKSPACE_ADMIN,
          workspace: { id: workspaceId }
        }
      ]
    };

    // Mock up some db functions.
    const findOne = jest.fn().mockReturnValue({
      id: id,
      roleBinding: { workspace: { id: workspaceId } }
    });

    // Construct db object for context.
    const prisma = {
      serviceAccount: { findOne, delete: jest.fn().mockReturnValue({ id }) }
    };

    const vars = {
      serviceAccountUuid: id,
      workspaceUuid: workspaceId
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(findOne.mock.calls).toHaveLength(1);
    expect(prisma.serviceAccount.delete.mock.calls).toHaveLength(1);
  });

  test("request throws if service account is not found", async () => {
    // Create mock user.
    const workspaceId = casual.uuid;

    const user = {
      id: casual.uuid,
      username: casual.email,
      roleBindings: [
        {
          role: WORKSPACE_ADMIN,
          workspace: { id: workspaceId }
        }
      ]
    };

    // Mock up some db functions.
    const findOne = jest.fn();

    // Construct db object for context.
    const prisma = {
      serviceAccount: { findOne, delete: jest.fn() }
    };

    const vars = {
      serviceAccountUuid: casual.uuid,
      workspaceUuid: workspaceId
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma, user }, vars);
    expect(res.errors).toHaveLength(1);
    expect(findOne.mock.calls).toHaveLength(1);
    expect(prisma.serviceAccount.delete.mock.calls).toHaveLength(0);
  });
});
