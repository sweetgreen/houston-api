import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const mutation = `
  mutation updateUser(
    $payload: JSON!
  ) {
    updateUser(
      payload: $payload,
    ) {
      id
      username
      profile {
        key
        value
      }
    }
  }
`;

describe("updateUser", () => {
  test("typical request is successful", async () => {
    // Mock up a user.
    const user = { id: casual.uuid };

    // Mock up some functions.
    const update = jest.fn().mockReturnValue({
      id: user.id,
      profile: [{ key: "test", value: "value" }]
    });

    // Construct db object for context.
    const prisma = {
      user: { update }
    };

    // Vars for the gql mutation.
    const vars = {
      payload: { fullName: casual.full_name }
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(update.mock.calls).toHaveLength(1);
  });
});
