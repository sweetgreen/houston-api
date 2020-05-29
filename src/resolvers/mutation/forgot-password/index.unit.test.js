import { schema } from "../../../schema";
import * as emailExports from "emails";
import casual from "casual";
import { graphql } from "graphql";

const mutation = `
mutation forgotPassword($email: String!) {
  forgotPassword(email: $email)
}
`;

describe("forgotPassword", () => {
  const email = casual.email;
  const sendEmail = jest.spyOn(emailExports, "sendEmail");

  describe("when email doesn't exist", () => {
    test("should not leak information about existing users", async () => {
      const emailQuery = jest.fn().mockReturnValue(null);
      const prisma = { email: { findOne: emailQuery } };

      const res = await graphql(schema, mutation, null, { prisma }, { email });

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
      const update = jest.fn();

      const prisma = {
        localCredential: { update },
        email: { findOne: emailQuery }
      };

      const res = await graphql(schema, mutation, null, { prisma }, { email });

      expect(res.errors).toBeUndefined();
      expect(res.data.forgotPassword).toBe(true);
      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith({
        data: { resetToken: expect.anything() },
        where: { id: emailQueryRes.user.localCredential.id }
      });
      const token = update.mock.calls[0][0].data.resetToken;
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

      const prisma = { email: { findOne: emailQuery } };

      const res = await graphql(schema, mutation, null, { prisma }, { email });

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
