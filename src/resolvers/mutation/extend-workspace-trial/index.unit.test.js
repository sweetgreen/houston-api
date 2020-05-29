import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const mutation = `
  mutation extendWorkspaceTrial(
    $workspaceUuid: Uuid!
    $extraDays: Int!
  ) {
    extendWorkspaceTrial(
      workspaceUuid: $workspaceUuid,
      extraDays: $extraDays,
    ) {
      id
      description
      label
    }
  }
`;

describe("extendWorkspaceTrial", () => {
  test("typical request is successful", async () => {
    // Create mock user.
    const user = { id: casual.uuid };
    const uuid = casual.uuid;

    // Mock up some functions.
    const extraDays = Math.floor(Math.random());
    const update = jest.fn().mockReturnValue({ id: uuid });
    const findOne = jest.fn().mockReturnValue({ trialEndsAt: casual.date });

    // Construct db object for context.
    const prisma = {
      workspace: { findOne, update }
    };

    // Vars for the gql mutation.
    const vars = {
      workspaceUuid: uuid,
      extraDays
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(update.mock.calls).toHaveLength(1);
  });
});
