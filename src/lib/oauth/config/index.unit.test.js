import {
  oauthUrl,
  getClient,
  providerCfg,
  ClientCache,
  getCookieList,
  getClaim,
  providerEnabled,
  enabledProviders
} from "./index";
import { version, houston } from "utilities";
import { URLSearchParams } from "url";

describe("oauth configuration", () => {
  const nonce = "fake-nonce";
  beforeAll(() => {
    providerCfg.google.clientId = "fake-google-clientId";
    providerCfg.auth0.clientId = "fake-auth0-clientId";
  });
  test("houston url is generated successfully", () => {
    expect(oauthUrl()).toEqual(expect.stringMatching(/https?:\/\/houston./));
  });

  test("provider is returned for valid provider string", async () => {
    await expect(getClient("google")).resolves.toBeTruthy();
    await expect(getClient("auth0")).resolves.toBeTruthy();
  });

  describe("auth0 provider", () => {
    let client;
    beforeAll(async () => {
      client = await getClient("auth0");
    });

    test("Uses global redirector for production", async () => {
      const old_env = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = "production";
        expect(client.oauthRedirectUrl()).toEqual(
          "https://redirect.astronomer.io"
        );
      } finally {
        process.env.NODE_ENV = old_env;
      }
    });

    test("Uses local redirector for dev", async () => {
      expect(client.oauthRedirectUrl()).toEqual(
        expect.stringMatching(/https?:\/\/houston./)
      );
    });

    describe("when using a different discoveryUrl", () => {
      const old_url = providerCfg.auth0.discoveryUrl;
      beforeAll(async () => {
        // This isn't a valid Auth0 url, so we don't want to _fetch_ it, just pretened that we did.
        providerCfg.auth0.discoveryUrl = "https://my-fake-org.auth0.com";
      });
      afterAll(async () => {
        providerCfg.auth0.discoveryUrl = old_url;
      });

      test("should use local redirector", async () => {
        expect(client.oauthRedirectUrl()).toEqual(
          expect.stringMatching(/https?:\/\/houston./)
        );
      });
    });
  });

  describe("When github is enabled", () => {
    beforeAll(() => {
      providerCfg.github.enabled = true;
    });

    afterAll(() => {
      ClientCache.delete("github");
    });

    test("should use the Auth0 provider", async () => {
      const client = await getClient("github");
      expect(client.issuer.metadata.name).toBe("auth0");
      expect(client.metadata.displayName).toBe("GitHub");
    });

    test("should include connection in URL", async () => {
      const client = await getClient("github");
      const params = new URLSearchParams(client.authUrl(nonce));

      expect(params.get("connection")).toBe("github");
    });

    test("should include right integration in state", async () => {
      const client = await getClient("github");
      const params = new URLSearchParams(client.authUrl(nonce));

      const state = JSON.parse(params.get("state"));
      expect(state.integration).toBe("github");
    });
  });

  describe("when google client_id is not", () => {
    let client;
    beforeAll(async () => {
      providerCfg.google.clientId = "fake-client-id";
      client = await getClient("google");
    });

    afterAll(() => {
      ClientCache.delete("google");
    });

    test("should use Google directly", async () => {
      expect(client.issuer.metadata.name).toBe("google");
      expect(client.metadata.displayName).toBe("Google");
    });

    test("should not include connection in URL", async () => {
      const params = new URLSearchParams(client.authUrl(nonce));

      expect(params.get("connection")).toBeNull();
    });

    test("should return starturl for the provider without provider name", async () => {
      const client = await getClient("google");
      const url = client.startUrl();
      const expected = `${houston()}/${version()}/oauth/start?provider=google`;
      expect(url).toBe(expected);
    });

    test("should use local redirector", async () => {
      expect(client.oauthRedirectUrl()).toEqual(
        expect.stringMatching(/https?:\/\/houston./)
      );
    });
  });

  test("throws error for invalid provider string", async () => {
    await expect(getClient("notaprovider")).rejects.toThrow();
  });
});

describe("When google client_id is null", () => {
  const nonce = "fake-nonce";
  beforeAll(() => {
    providerCfg.google.clientId = null;
  });

  afterAll(() => {
    ClientCache.delete("google");
  });

  test("should use the Auth0 provider", async () => {
    const client = await getClient("google");
    expect(client.issuer.metadata.name).toBe("auth0");
    expect(client.metadata.displayName).toBe("Google");
  });

  test("should include connection in URL", async () => {
    const client = await getClient("google");
    const params = new URLSearchParams(client.authUrl(nonce));

    expect(params.get("connection")).toBe("google-oauth2");
  });

  test("should include right integration in state", async () => {
    const client = await getClient("google");
    const params = new URLSearchParams(client.authUrl(nonce));

    const state = JSON.parse(params.get("state"));
    expect(state.integration).toBe("google-oauth2");
  });

  test("should return starturl for the provider", async () => {
    const client = await getClient("google");
    const url = client.startUrl();
    const expected = `${houston()}/${version()}/oauth/start?provider=google`;
    expect(url).toBe(expected);
  });
});

describe("providerEnabled", () => {
  beforeAll(() => {
    providerCfg.google.enabled = true;
  });

  test("check if a provider is enabled or not", async () => {
    const isProviderEnabled = await providerEnabled("google");
    expect(isProviderEnabled).toBeTruthy();
  });
});

describe("enabledProviders", () => {
  beforeAll(() => {
    providerCfg.google.enabled = true;
    providerCfg.auth0.enabled = false;
    providerCfg.github.enabled = false;
  });

  test("should return list of all enabled providers", async () => {
    const providers = await enabledProviders();
    expect(providers).toHaveLength(1);
  });
});

describe("getClaims", () => {
  test("get mapped value for claims", async () => {
    const email = "user@astronomer.io";
    const name = "User";
    const sub = "123456789";
    const claims = {
      email,
      name,
      sub
    };
    const claimEmail = getClaim(claims, {}, "email");
    expect(claimEmail).toBe(email);
  });
});

describe("getCookieList", () => {
  test("should return a list of cookies", async () => {
    const cookies = "ajs_anonymous_id=fake-id; nonce=some-fake-nonce";
    const cookieList = await getCookieList(cookies);

    expect(cookieList.nonce).toBe("some-fake-nonce");
    expect(cookieList.ajs_anonymous_id).toBe("fake-id");
  });
});
