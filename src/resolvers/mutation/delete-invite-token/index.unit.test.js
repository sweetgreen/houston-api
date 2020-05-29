import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const query = `
  mutation deleteInviteToken(
    $inviteUuid: Uuid
  ) {
    deleteInviteToken(
      inviteUuid: $inviteUuid
    ) {
      id
    }
  }
`;

describe("deleteInviteToken", () => {
  test("typical request is successful", async () => {
    // Construct db object for context.
    const prisma = {
      inviteToken: {
        // Mock up some db functions.
        delete: jest.fn().mockReturnValue({
          id: casual.uuid
        })
      }
    };

    const vars = {
      inviteUuid: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();
    expect(prisma.inviteToken.delete.mock.calls.length).toBe(1);
  });
});
