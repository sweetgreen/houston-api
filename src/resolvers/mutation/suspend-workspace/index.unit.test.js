import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const mutation = `
  mutation suspendWorkspace(
    $workspaceUuid: Uuid!
    $isSuspended: Boolean!
  ) {
    suspendWorkspace(
      workspaceUuid: $workspaceUuid,
      isSuspended: $isSuspended,
    ) {
      id
      description
      label
    }
  }
`;

describe("suspendWorkspace", () => {
  test("typical request is successful", async () => {
    // Mock up some functions.
    const update = jest.fn().mockReturnValue({ id: casual.uuid });

    // Construct db object for context.
    const prisma = {
      workspace: { update }
    };

    // Vars for the gql mutation.
    const vars = {
      workspaceUuid: casual.uuid,
      isSuspended: false
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();
    expect(update.mock.calls).toHaveLength(1);
  });
});
