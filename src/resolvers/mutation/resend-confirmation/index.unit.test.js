import resolvers from "resolvers";
import { sendEmail } from "emails";
import shortid from "shortid";
import casual from "casual";
import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import { importSchema } from "graphql-import";

jest.mock("emails");

const mutation = `
mutation resendConfirmation($email: String!) {
  resendConfirmation(email: $email)
}
`;

// Import our application schema
const schema = makeExecutableSchema({
  typeDefs: importSchema("src/schema.graphql"),
  resolvers
});

describe("resendConfirmation", () => {
  const email = casual.email;

  describe("when email doesn't exist", () => {
    test("should not leak information about existing users", async () => {
      const emailQuery = jest.fn().mockReturnValue(null);
      const db = { query: { email: emailQuery } };

      const res = await graphql(schema, mutation, null, { db }, { email });

      expect(res.errors).toBeUndefined();
      expect(sendEmail).not.toHaveBeenCalled();
      expect(res.data.resendConfirmation).toBe(false);
    });
  });

  describe("when email is already confirrmed", () => {
    test("should not leak information about existing users", async () => {
      const emailQuery = jest.fn().mockReturnValue({ verified: true });
      const db = { query: { email: emailQuery } };

      const res = await graphql(schema, mutation, null, { db }, { email });

      expect(res.errors).toBeUndefined();
      expect(sendEmail).not.toHaveBeenCalled();
      expect(res.data.resendConfirmation).toBe(false);
    });
  });

  describe("when email not yet verified", () => {
    test("should reuse the existing token", async () => {
      const emailQueryRes = {
        address: email,
        verified: false,
        token: shortid.generate()
      };
      const emailQuery = jest.fn().mockReturnValue(emailQueryRes);

      const db = {
        query: { email: emailQuery }
      };

      const res = await graphql(schema, mutation, null, { db }, { email });

      expect(res.errors).toBeUndefined();
      expect(res.data.resendConfirmation).toBe(true);
      expect(sendEmail).toHaveBeenCalledTimes(1);
      expect(sendEmail).toHaveBeenCalledWith(email, "confirm-email", {
        token: emailQueryRes.token,
        UIUrl: "http://app.astronomer.io:5000",
        strict: true
      });
    });
  });
});
