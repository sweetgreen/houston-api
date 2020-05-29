import { token, permissions, isAdmin } from "./index";
import { USER_STATUS_ACTIVE } from "constants";

describe("AuthUser", () => {
  test("token resolves a valid token", async () => {
    const userId = "12345";
    const cookie = jest.fn();
    const prisma = {
      user: {
        findOne: jest.fn().mockReturnValueOnce({ status: USER_STATUS_ACTIVE })
      }
    };
    const res = await token({ userId }, {}, { prisma, res: { cookie } });

    // Test that uuid gets set propertly.
    expect(res.payload.uuid).toBe(userId);

    // Test that the issued at is now.
    expect(res.payload.iat).toBe(Math.floor(new Date() / 1000));

    // Test that the expiration is greater than now.
    expect(res.payload.exp).toBeGreaterThan(Math.floor(new Date() / 1000));

    // Test that the cookie function is called.
    expect(cookie.mock.calls.length).toBe(1);
  });

  test("permissions is an empty object", () => {
    expect(permissions()).toEqual({});
  });

  test("isAdmin is false", () => {
    expect(isAdmin()).toEqual(false);
  });
});
