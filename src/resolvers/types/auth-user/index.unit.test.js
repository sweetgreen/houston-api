import { token, permissions, isAdmin } from "./index";
import { USER_STATUS_ACTIVE } from "constants";

describe("AuthUser", () => {
  beforeAll(() => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(1594220731300);
  });

  afterAll(() => {
    jest.resetAllMocks();
    jest.useRealTimers();
  });

  test("token resolves a valid token", async () => {
    const userId = "12345";
    const cookie = jest.fn();
    const db = {
      query: {
        user: jest.fn().mockReturnValueOnce({ status: USER_STATUS_ACTIVE })
      }
    };
    const res = await token({ userId }, {}, { db, res: { cookie } });
    const testDate = Math.floor(new Date() / 1000);

    // Test that uuid gets set propertly.
    expect(res.payload.uuid).toBe(userId);

    // Test that the issued at is now.
    expect(res.payload.iat).toBe(testDate);

    // Test that the expiration is greater than now.
    expect(res.payload.exp).toBeGreaterThan(testDate);

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
