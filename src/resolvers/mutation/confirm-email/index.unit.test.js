import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";
import {
  USER_STATUS_ACTIVE,
  USER_STATUS_PENDING,
  USER_STATUS_BLOCKED
} from "constants";

const mutation = `
mutation confirmEmail($token: String!) {
  confirmEmail(token: $token) {
    user { id }
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

describe("confirmEmail", () => {
  const token = casual.uuid;

  describe("when token is invalid", () => {
    test("should return an error", async () => {
      const q = jest.fn().mockReturnValue(null);
      const prisma = { email: { findOne: q } };

      const res = await graphql(schema, mutation, null, { prisma }, { token });

      expect(res.errors).toHaveLength(1);
      expect(res.errors[0]).toHaveProperty("extensions.code", "BAD_USER_INPUT");
      expect(res.errors[0]).toHaveProperty("message", "Invalid token");
    });
  });

  describe("when token is valid", () => {
    describe("and the user is already active", () => {
      test("should verify the email", async () => {
        const emailRecord = {
          token,
          verified: true,
          user: { status: USER_STATUS_ACTIVE, id: 0 }
        };

        const update = jest.fn().mockReturnValue();
        const prisma = {
          email: {
            findOne: jest.fn().mockReturnValue(emailRecord),
            update: update
          },
          user: { findOne: jest.fn().mockReturnValue(emailRecord.user) }
        };

        const cookie = jest.fn();

        const res = await graphql(
          schema,
          mutation,
          null,
          { prisma, res: { cookie } },
          { token }
        );

        expect(res).not.toHaveProperty("errors");

        expect(update).toHaveBeenCalledWith({
          data: { token: null, verified: true },
          where: { token }
        });
        expect(cookie).toHaveBeenCalledTimes(1);

        const now = Math.floor(new Date() / 1000);
        const { iat, exp } = res.data.confirmEmail.token.payload;

        expect(iat).toBeDefined();
        expect(exp).toBeGreaterThan(now);
      });
    });

    describe("and the user is pending", () => {
      test("should update the status", async () => {
        const emailRecord = {
          token,
          verified: false,
          user: { status: USER_STATUS_PENDING, id: 0 }
        };
        const update = jest.fn().mockReturnValue();
        const prisma = {
          email: {
            findOne: jest.fn().mockReturnValue(emailRecord),
            update: update
          },
          user: {
            findOne: jest.fn().mockReturnValue({
              ...emailRecord.user,
              status: USER_STATUS_ACTIVE
            })
          }
        };

        const cookie = jest.fn();

        const res = await graphql(
          schema,
          mutation,
          null,
          { prisma, res: { cookie } },
          { token }
        );

        expect(res).not.toHaveProperty("errors");

        expect(update).toHaveBeenCalledWith({
          data: {
            token: null,
            verified: true,
            user: { update: { status: USER_STATUS_ACTIVE } }
          },
          where: { token }
        });
        expect(cookie).toHaveBeenCalledTimes(1);

        const now = Math.floor(new Date() / 1000);
        const { iat, exp } = res.data.confirmEmail.token.payload;

        expect(iat).toBeDefined();
        expect(exp).toBeGreaterThan(now);
      });
    });

    describe("and the user is blocked", () => {
      test("should not unblock the user or verify the email", async () => {
        const emailRecord = {
          token,
          verified: false,
          user: { status: USER_STATUS_BLOCKED, id: 0 }
        };

        const prisma = {
          email: {
            findOne: jest.fn().mockReturnValue(emailRecord)
          }
        };

        const res = await graphql(
          schema,
          mutation,
          null,
          { prisma },
          { token }
        );

        expect(res.errors).toHaveLength(1);
        expect(res.errors[0]).toHaveProperty(
          "extensions.code",
          "BAD_USER_INPUT"
        );
        expect(res.errors[0]).toHaveProperty("message", "Invalid token");
      });
    });
  });
});
