import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

jest.mock("emails");

const query = `
  mutation workspaceRemoveUser(
    $workspaceUuid: Uuid!
    $userUuid: Uuid!
  ) {
    workspaceRemoveUser(
      workspaceUuid: $workspaceUuid
      userUuid: $userUuid
    ) {
      id
    }
  }
`;

describe("workspaceRemoveUser", () => {
  test("removes the workspace role binding", async () => {
    // Create mock user.
    const workspaceUuid = casual.uuid;
    const userUuid = casual.uuid;

    // Mock up some db functions.
    const deleteManyRoleBindings = jest.fn();
    const findOne = jest.fn().mockReturnValue({ id: workspaceUuid });

    // Construct db object for context.
    const prisma = {
      workspace: { findOne },
      roleBindings: { delete: deleteManyRoleBindings }
    };

    const vars = {
      workspaceUuid,
      userUuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();

    const where = { workspace: { id: workspaceUuid }, user: { id: userUuid } };
    expect(deleteManyRoleBindings).toHaveBeenCalledWith({ where });
    expect(findOne).toHaveBeenCalled();
  });
});
