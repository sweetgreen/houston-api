import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const mutation = `
  mutation deleteWorkspace(
    $workspaceUuid: Uuid!
  ) {
    deleteWorkspace(
      workspaceUuid: $workspaceUuid
    ) {
        id
    }
  }
`;

describe("deleteWorkspace", () => {
  test("typical request is successful", async () => {
    // Create some deployment vars.
    const id = casual.uuid;

    // Mock up some db functions.
    const findMany = jest.fn().mockReturnValue([]);

    // Construct db object for context.
    const prisma = {
      deployment: {
        findMany
      },
      workspace: {
        delete: jest.fn().mockReturnValue({ id })
      }
    };

    // Mock up a user for context
    const user = { id: casual.uuid };

    // Vars for the gql mutation.
    const vars = {
      workspaceUuid: id
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma, user }, vars);

    expect(res.errors).toBeUndefined();
    expect(findMany.mock.calls.length).toBe(1);
    expect(prisma.workspace.delete.mock.calls.length).toBe(1);
    expect(res.data.deleteWorkspace.id).toBe(id);
    expect(findMany).toBeCalledWith({
      where: { id, deletedAt: null },
      select: { id: true }
    });
  });

  test("errors if deployments are present", async () => {
    // Create some deployment vars.
    const id = casual.uuid;

    // Mock up some db functions.
    const findMany = jest.fn().mockReturnValue([{ id }]);

    // Construct db object for context.
    const prisma = {
      deployment: {
        findMany
      },
      workspace: {
        delete: jest.fn().mockReturnValue({ id })
      }
    };

    // Vars for the gql mutation.
    const vars = {
      workspaceUuid: id
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma }, vars);

    expect(res.errors).toBeDefined();
    expect(findMany.mock.calls.length).toBe(1);
    expect(prisma.workspace.delete.mock.calls.length).toBe(0);
    expect(res.data).toBe(null);
    expect(findMany).toBeCalledWith({
      where: { id, deletedAt: null },
      select: { id: true }
    });
  });
});
