import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const query = `
  query workspace(
    $workspaceUuid: Uuid!
  ) {
    workspace(
      workspaceUuid: $workspaceUuid
    ) {
      users {
        id
      }
    }
  }
`;

describe("workspace", () => {
  test("typical request is successful", async () => {
    const commander = {
      request: jest.fn()
    };

    const user = {
      id: casual.uuid,
      roleBindings: [{ workspace: { id: casual.uuid } }]
    };

    // Mock up some db functions.
    const findOne = jest.fn().mockReturnValue({});
    const findMany = jest.fn().mockReturnValue([]);

    // Construct db object for context.
    const prisma = {
      workspace: { findOne, findMany }
    };

    const vars = {
      workspaceUuid: casual.uuid
    };

    // Run the graphql mutation.
    await graphql(schema, query, null, { prisma, commander, user }, vars);
    expect(prisma.workspace.findOne.mock.calls.length).toBe(1);
    expect(prisma.workspace.findMany.mock.calls.length).toBe(0);
  });
});
