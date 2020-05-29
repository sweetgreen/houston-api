import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const mutation = `
  mutation addCustomerId(
    $workspaceUuid: Uuid!
    $stripeCustomerId: String!
  ) {
    addCustomerId(
      workspaceUuid: $workspaceUuid,
      stripeCustomerId: $stripeCustomerId
    ) {
      label
      stripeCustomerId
    }
  }
`;

describe("addCustomerId", () => {
  test("typical request is successful", async () => {
    // Mock up some functions.
    const update = jest
      .fn()
      .mockReturnValue({ label: casual.word, stripeCustomerId: casual.uuid });

    // Construct db object for context.
    const prisma = {
      workspace: { update }
    };
    // Vars for the gql mutation.
    const vars = {
      workspaceUuid: casual.uuid,
      stripeCustomerId: casual.uuid
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();
    expect(update.mock.calls.length).toBe(1);
  });
});
