import { schema } from "../../../schema";
import { sendEmail } from "emails";
import casual from "casual";
import { graphql } from "graphql";
import { INVITE_SOURCE_SYSTEM } from "constants";

jest.mock("emails");

// Define our mutation
const gql = `
  mutation inviteUser(
    $email: String!
  ) {
    inviteUser(email: $email) {
      id
      token
    }
  }
`;

describe("inviteUser", () => {
  // Vars for the gql mutation.
  const vars = { email: casual.email.toLowerCase() };

  const emailQuery = jest.fn().mockReturnValue(null);
  const findMany = jest.fn().mockReturnValue([]);
  const create = jest.fn().mockReturnValue({ id: casual.uuid });
  // Construct db object for context.
  const prisma = {
    email: { findOne: emailQuery },
    inviteToken: { create, findMany }
  };

  test("when inviting a new user", async () => {
    const res = await graphql(schema, gql, null, { prisma }, vars);
    expect(res).not.toHaveProperty("errors");

    expect(create).toHaveBeenCalledWith({
      data: {
        email: vars.email,
        token: expect.any(String),
        source: INVITE_SOURCE_SYSTEM
      },
      select: { id: true, token: true }
    });

    expect(sendEmail).toBeCalledWith(vars.email, "user-invite", {
      strict: true,
      UIUrl: "http://app.astronomer.io:5000",
      token: create.mock.calls[0][0].data.token
    });
  });

  test("when trying to invite an existing user", async () => {
    emailQuery.mockReturnValueOnce({ user: { id: casual.uuid } });
    const res = await graphql(schema, gql, null, { prisma }, vars);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]).toHaveProperty("extensions.code", "DUPLICATE_EMAIL");
  });

  test("when trying to invite an existing invite", async () => {
    findMany.mockReturnValueOnce([{ id: "test" }]);
    const res = await graphql(schema, gql, null, { prisma }, vars);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]).toHaveProperty(
      "extensions.code",
      "USER_ALREADY_INVITED"
    );
  });
});
