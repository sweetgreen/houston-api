import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const mutation = `
  mutation createWorkspace(
    $label: String!
    $description: String
  ) {
    createWorkspace(
      label: $label
      description: $description
    ) {
      id
      label
      description
    }
  }
`;

describe("createWorkspace", () => {
  test("typical request is successful", async () => {
    // Create mock user.
    const user = { id: casual.uuid };

    // Mock up some db functions.
    const create = jest
      .fn()
      .mockReturnValue({ id: casual.uuid, createdAt: casual.date });

    // Construct db object for context.
    const prisma = { workspace: { create } };

    // Create args.
    const vars = {
      label: casual.word,
      description: casual.description
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(create.mock.calls.length).toBe(1);
  });
});
