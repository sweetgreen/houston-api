import { schema } from "../../../schema";
import * as users from "users";
import casual from "casual";
import { graphql } from "graphql";
import { USER_STATUS_ACTIVE } from "constants";

// Define our mutation
const mutation = `
  mutation createUser(
    $email: String!
    $password: String!
    $username: String!
    $inviteToken: String
  ) {
    createUser(
      email: $email,
      password: $password,
      username: $username,
      inviteToken: $inviteToken
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

describe("createUser", () => {
  test("typical request is successful", async () => {
    // Mock up some functions.
    const create = jest.fn();
    const findOne = jest.fn(() => ({
      status: USER_STATUS_ACTIVE,
      id: casual.uuid
    }));
    const cookie = jest.fn();

    // Construct db object for context.
    const prisma = {
      localCredential: { findOne, create },
      user: {
        findOne: jest
          .fn()
          .mockReturnValue({ id: casual.uuid, status: USER_STATUS_ACTIVE })
      }
    };

    // Set up our spy.
    const createUserSpy = jest
      .spyOn(users, "createUser")
      .mockReturnValue(casual.uuid);

    // Vars for the gql mutation.
    const vars = {
      email: casual.email,
      password: casual.password,
      username: casual.username
    };

    // Run the graphql mutation.
    const res = await graphql(
      schema,
      mutation,
      null,
      { prisma, res: { cookie } },
      vars
    );

    expect(res.errors).toBeUndefined();

    expect(createUserSpy.mock.calls).toHaveLength(1);
    // We shouldn't be orverriding the active property here, that is only for
    // oAuth flows.
    expect(createUserSpy.mock.calls[0][0]).not.toHaveProperty("active");

    expect(create.mock.calls).toHaveLength(1);
    expect(cookie.mock.calls).toHaveLength(1);

    expect(res.data.createUser.token.payload.iat).toBeDefined();
    expect(res.data.createUser.token.payload.exp).toBeGreaterThan(
      Math.floor(new Date() / 1000)
    );
  });
});
