import {
  publicSignup,
  externalSignupUrl,
  localEnabled,
  initialSignup,
  providers
} from "./index";
import casual from "casual";

describe("Auth Config", () => {
  test("should check if publicSignups are enabled", () => {
    const config = publicSignup();
    expect(config).toBeFalsy();
  });

  test("should return external signup url", () => {
    const signupUrl = "https://astronomer.io";
    const config = externalSignupUrl();
    expect(config).toBe(signupUrl);
  });

  test("should return true if there are no initial signups", () => {
    const parent = { id: casual.uuid };
    const prisma = {
      user: { findMany: jest.fn().mockReturnValue([]) }
    };
    initialSignup(parent, {}, { prisma });
    expect(prisma.user.findMany.mock.calls).toHaveLength(1);
  });

  test("check if local auth is enabled", () => {
    const config = localEnabled();
    expect(config).toBeTruthy();
  });

  test("should get list of all supported auth providers", async () => {
    const url = "http://astronomer.io";
    const result = await providers(url);
    expect(result).toHaveLength(2);
    result.forEach(auth => {
      expect(auth).toHaveProperty("name");
      expect(auth).toHaveProperty("url");
      expect(auth).toHaveProperty("displayName");
    });
  });
});
