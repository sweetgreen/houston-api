import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const mutation = `
  mutation verifyEmail(
    $email: String!
  ) {
    verifyEmail(
      email: $email
    )
  }
`;

describe("verifyEmail", () => {
  // Define constants to be applied to each test
  const email = casual.email;
  // Vars for the gql mutation.
  const vars = {
    email
  };
  test("typical request is successful", async () => {
    const usr = {
      id: casual.uuid
    };

    // Mock up some functions.
    const updateUser = jest.fn();

    // Construct db object for context.
    const prisma = {
      user: {
        findMany: jest.fn().mockReturnValue([usr]),
        update: updateUser
      }
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();
    expect(updateUser).toHaveBeenCalledTimes(1);
  });

  test("throws error if user not found", async () => {
    const prisma = {
      user: {
        findMany: jest.fn().mockReturnValue([])
      }
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma }, vars);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].message).toEqual(
      expect.stringMatching(/^The requested resource was not found/)
    );
  });
});
