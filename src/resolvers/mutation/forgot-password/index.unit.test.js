import resolvers from "resolvers";
import * as emailExports from "emails";
import casual from "casual";
import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import { importSchema } from "graphql-import";

const mutation = `
mutation forgotPassword($email: String!) {
  forgotPassword(email: $email)
}
`;

// Import our application schema
const schema = makeExecutableSchema({
  typeDefs: importSchema("src/schema.graphql"),
  resolvers
});

describe("forgotPassword", () => {
  const email = casual.email;
  const sendEmail = jest.spyOn(emailExports, "sendEmail");

  describe("when email doesn't exist", () => {
    test("should not leak information about existing users", async () => {
      const emailQuery = jest.fn().mockReturnValue(null);
      const db = { query: { email: emailQuery } };

      const res = await graphql(schema, mutation, null, { db }, { email });

      expect(res.errors).toBeUndefined();
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(
        email,
        "forgot-password-no-account",
        { strict: true }
      );
      expect(res.data.forgotPassword).toBe(true);
    });
  });

  describe("when email exists", () => {
    test("local users should receive a reset email", async () => {
      const emailQueryRes = {
        address: email,
        user: {
          id: casual.uuid,
          localCredential: {
            id: casual.uuid,
            resetToken: null
          }
        }
      };
      const emailQuery = jest.fn().mockReturnValue(emailQueryRes);
      const updateLocalCredential = jest.fn();

      const db = {
        mutation: { updateLocalCredential },
        query: { email: emailQuery }
      };

      const res = await graphql(schema, mutation, null, { db }, { email });

      expect(res.errors).toBeUndefined();
      expect(res.data.forgotPassword).toBe(true);
      expect(updateLocalCredential).toHaveBeenCalledTimes(1);
      expect(updateLocalCredential).toHaveBeenCalledWith({
        data: { resetToken: expect.anything() },
        where: { id: emailQueryRes.user.localCredential.id }
      });
      const token = updateLocalCredential.mock.calls[0][0].data.resetToken;
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(email, "forgot-password", {
        token,
        UIUrl: "http://app.astronomer.io:5000",
        strict: true
      });
    });

    test("oauth users should receive a email without reset token", async () => {
      const emailQueryRes = {
        address: email,
        user: {
          id: casual.uuid,
          localCredential: null
        }
      };
      const emailQuery = jest.fn().mockReturnValue(emailQueryRes);

      const db = {
        query: { email: emailQuery }
      };

      const res = await graphql(schema, mutation, null, { db }, { email });

      expect(res.errors).toBeUndefined();
      expect(res.data.forgotPassword).toBe(true);
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(
        email,
        "forgot-password-not-local-creds",
        { strict: true }
      );
    });
  });
});
