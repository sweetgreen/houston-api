import {
  publicSignup,
  externalSignupUrl,
  localEnabled,
  initialSignup,
  providers
} from "./index";
import * as oAuthConfig from "../../../lib/oauth/config";
import { prisma } from "generated/client";

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

  test("should return true if there are no initial signups", async () => {
    prisma.usersConnection = jest.fn().mockReturnValue({
      aggregate: jest.fn().mockReturnValue({
        count: jest
          .fn()
          .mockName("usersConnection")
          .mockReturnValue(0)
      })
    });

    const hasInitialSignups = await initialSignup();
    expect(hasInitialSignups).toBeTruthy();
  });

  test("check if local auth is enabled", () => {
    const config = localEnabled();
    expect(config).toBeTruthy();
  });

  test("should get list of all supported auth providers", async () => {
    const url = "http://astronomer.io";
    const clientId = "fake-google-clientId";
    const displayName = "google";
    const metadata = {
      displayName
    };

    jest.spyOn(oAuthConfig, "getClient").mockReturnValue({
      clientId,
      authUrl: jest.fn(),
      metadata
    });
    const result = await providers(url);
    expect(result).toHaveLength(2);
    result.forEach(auth => {
      expect(auth).toHaveProperty("name");
      expect(auth).toHaveProperty("url");
      expect(auth).toHaveProperty("displayName");
    });
  });
});
