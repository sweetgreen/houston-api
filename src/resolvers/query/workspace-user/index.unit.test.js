import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const query = `
  query workspaceUser(
    $workspaceId: Uuid!
    $user: UserSearch!
  ) {
    workspaceUser(
      workspaceUuid: $workspaceId,
      user: $user
    ) {
      id
      username
    }
  }
`;

describe("workspaceUser", () => {
  // Mock up some db functions.

  // Mock functions
  const findOne = jest.fn().mockReturnValue({
    id: casual.uuid,
    username: casual.word
  });

  // Construct db object for context.
  const prisma = {
    user: { findOne }
  };

  // Create vars.
  const vars = {
    workspaceId: casual.uuid,
    user: {
      username: casual.word
    }
  };

  test("when user exists", async () => {
    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();
    expect(prisma.user.findOne).toHaveBeenCalled();
  });

  test("when user not in workspace", async () => {
    // Run the graphql mutation.
    findOne.mockReturnValueOnce();
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toHaveLength(1);
    expect(prisma.user.findOne).toHaveBeenCalled();
  });
});
