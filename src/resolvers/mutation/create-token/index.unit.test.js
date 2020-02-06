import resolvers from "resolvers";
import bcrypt from "bcryptjs";
import casual from "casual";
import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import { importSchema } from "graphql-import";
import { USER_STATUS_ACTIVE, USER_STATUS_PENDING } from "constants";

// Import our application schema
const schema = makeExecutableSchema({
  typeDefs: importSchema("src/schema.graphql"),
  resolvers
});

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
  const query = {
    // The return value for these are set in each test
    users: jest.fn(),
    user: jest.fn()
  };
  const db = { query };
  const user = { id: casual.uuid };

  test("typical request is successful", async () => {
    const usr = {
      id: 0,
      status: USER_STATUS_ACTIVE,
      localCredential: { password: await hash }
    };

    // Mock up some db functions.
    const users = query.users.mockReturnValue([usr]);
    query.user.mockReturnValue(usr);
    const cookie = jest.fn();

    // Run the graphql mutation.
    const res = await graphql(
      schema,
      mutation,
      null,
      { db, user, res: { cookie } },
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
    query.users.mockReturnValue([]);

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { db }, vars);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].message).toEqual(
      expect.stringMatching(/^The requested resource was not found/)
    );
  });

  test("throws error if no credentials are found", async () => {
    // Mock user
    const usr = { id: 0, status: "" };

    // Mock up some db functions.
    query.users.mockReturnValue([usr]);

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { db }, vars);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].message).toEqual(
      expect.stringMatching(/^No password credentials found/)
    );
  });

  test("throws error if credentials are invalid", async () => {
    // Mock user
    const usr = { id: 0, status: "", localCredential: { password: "wrong" } };

    // Mock up some db functions.
    query.users.mockReturnValue([usr]);

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { db }, vars);
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
    query.users.mockReturnValue([usr]);

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { db }, vars);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].message).toEqual(
      // The UI expects this to match to show the right message
      expect.stringMatching(/awaiting email confirmation/)
    );
    expect(res.errors[0].extensions.code).toBe("ACCOUNT_NOT_CONFIRMED");
  });
});
