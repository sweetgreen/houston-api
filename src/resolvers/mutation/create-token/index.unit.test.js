import { schema } from "../../../schema";
import bcrypt from "bcryptjs";
import casual from "casual";
import { graphql } from "graphql";
import { USER_STATUS_ACTIVE, USER_STATUS_PENDING } from "constants";

// Define our mutation
const mutation = `
  mutation createToken(
    $identity: String!
    $password: String!
  ) {
    createToken(
      identity: $identity,
      password: $password
    ) {
      user {
        id
        username
      }
      token {
        value
        payload {
          uuid
          iat
          exp
        }
      }
    }
  }
`;

describe("createToken", () => {
  // Vars for the gql mutation.
  const vars = {
    identity: casual.email,
    password: casual.password
  };
  const hash = bcrypt.hash(vars.password, 10);
  const user = {
    // The return value for these are set in each test
    findMany: jest.fn(),
    findOne: jest.fn()
  };
  const prisma = { user };

  test("typical request is successful", async () => {
    const usr = {
      id: 0,
      status: USER_STATUS_ACTIVE,
      localCredential: { password: await hash }
    };

    // Mock up some db functions.
    const users = prisma.user.findMany.mockReturnValue([usr]);
    prisma.user.findOne.mockReturnValue(usr);
    const cookie = jest.fn();

    // Run the graphql mutation.
    const res = await graphql(
      schema,
      mutation,
      null,
      { prisma, res: { cookie } },
      vars
    );

    expect(users).toHaveBeenCalledTimes(1);
    expect(cookie).toHaveBeenCalledTimes(1);

    const now = Math.floor(new Date() / 1000);
    const { iat, exp } = res.data.createToken.token.payload;

    // Testing exact equality can sometimes be off by a millisecond.
    // This gives us a small range to test within instead.
    expect(iat).toBeGreaterThan(now - 5);
    expect(iat).toBeLessThan(now + 5);

    expect(exp).toBeGreaterThan(now);
  });

  test("throws error if user not found", async () => {
    // Mock up some db functions.
    prisma.user.findMany.mockReturnValue([]);

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma }, vars);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].message).toEqual(
      expect.stringMatching(/^The requested resource was not found/)
    );
  });

  test("throws error if no credentials are found", async () => {
    // Mock user
    const usr = { id: 0, status: "" };

    // Mock up some db functions.
    prisma.user.findMany.mockReturnValue([usr]);

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma }, vars);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].message).toEqual(
      expect.stringMatching(/^No password credentials found/)
    );
  });

  test("throws error if credentials are invalid", async () => {
    // Mock user
    const usr = { id: 0, status: "", localCredential: { password: "wrong" } };

    // Mock up some db functions.
    prisma.user.findMany.mockReturnValue([usr]);

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma }, vars);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].message).toEqual(
      // The UI expects this to match to show the right message
      expect.stringMatching(/invalid password/i)
    );
  });

  test("throws error if user is not active", async () => {
    // Mock user
    const usr = {
      id: 0,
      status: USER_STATUS_PENDING,
      localCredential: { password: await hash }
    };

    // Mock up some db functions.
    prisma.user.findMany.mockReturnValue([usr]);

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma }, vars);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].message).toEqual(
      // The UI expects this to match to show the right message
      expect.stringMatching(/awaiting email confirmation/)
    );
    expect(res.errors[0].extensions.code).toBe("ACCOUNT_NOT_CONFIRMED");
  });
});
