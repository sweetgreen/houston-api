import router from "./index";
import { prisma } from "generated/client";
import { PublicSignupsDisabledError } from "errors";
import * as userExports from "users";
import * as oAuthExports from "oauth/config";
import express from "express";
import request from "supertest";
import casual from "casual";
import jwt from "jsonwebtoken";

jest.mock("generated/client", () => {
  return {
    __esModule: true,
    prisma: jest.fn().mockName("MockPrisma")
  };
});

// Create test application.
const app = express()
  // Mock authentication middleware
  .use(function(req, res, next) {
    req.session = { user: { id: casual.uuid } };
    next();
  })
  .use(router);

describe("POST /oauth", () => {
  const nonce = "fake-nonce-value";
  const provider = "fake-provider";
  const integration = "test";
  const origin = "http://houston.local.astronomer.io:8871/v1/oauth/callback";
  const idToken = {
    provider,
    integration,
    nonce,
    origin
  };
  const expiresIn = 5000;
  const mockGetClient = {
    issuer: {
      metadata: {
        claimsMapping: {},
        fetchUserInfo: true
      }
    },
    callback: () => {
      return {
        claims: jest.fn().mockReturnValue({
          email: "TESTING@google.com",
          name: "test name",
          sub: "test-sub=",
          access_token: "some-token"
        })
      };
    },
    userinfo: () => {
      return {
        name: "Testing Name",
        picture: "http://www.astronomer.io/test.img"
      };
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(userExports, "isFirst").mockImplementation(() => true);
    prisma.users = jest
      .fn()
      .mockName("users")
      .mockReturnValue({
        $fragment: function() {
          return [
            {
              id: casual.uuid,
              roleBindings: [{ deployment: { id: casual.uuid } }]
            }
          ];
        }
      });
    prisma.updateUser = jest
      .fn()
      .mockName("updateUser")
      .mockReturnValue({
        $fragment: () => true
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    mockGetClient.issuer = null;
    mockGetClient.authorization = null;
    mockGetClient.user = null;
  });

  test("Should redirected user to login with PUBLIC_SIGNUPS_DISABLED code", async () => {
    prisma.users = jest
      .fn()
      .mockName("users")
      .mockReturnValue({
        $fragment: function() {
          return [];
        }
      });

    prisma.usersConnection = jest.fn().mockReturnValue({
      aggregate: jest.fn().mockReturnValue({
        count: jest
          .fn()
          .mockName("usersConnection")
          .mockReturnValue(0)
      })
    });

    jest.spyOn(userExports, "createUser").mockImplementation(() => {
      throw new PublicSignupsDisabledError();
    });

    const state = `{"provider":"google","integration":"google-oauth2","origin":"http://houston.local.astronomer.io:8871/v1/oauth/callback"}`;

    mockGetClient.issuer = {
      metadata: {
        claimsMapping: {},
        fetchUserInfo: true
      }
    };
    mockGetClient.callback = () => {
      return {
        claims: jest.fn().mockReturnValue({
          email: "TESTING@google.com",
          name: "test name",
          sub: "test-sub=",
          access_token: "some-token"
        })
      };
    };
    mockGetClient.userinfo = () => {
      return {
        name: "Testing Name",
        picture: "http://www.astronomer.io/test.img"
      };
    };

    jest.spyOn(oAuthExports, "getClient").mockImplementation(() => {
      return mockGetClient;
    });

    const res = await request(app)
      .post("/")
      .set("Cookie", [`nonce=${nonce}`])
      .send({
        id_token: jwt.sign(idToken, "test"),
        expires_in: expiresIn,
        state
      });

    expect(res.statusCode).toBe(302);
    expect(res.text).toBe(
      "Found. Redirecting to http://app.astronomer.io:5000/login?error=PUBLIC_SIGNUPS_DISABLED"
    );
  });

  test("Should not allow login if auth0 callback fails", async () => {
    const state = `{"provider":"google","integration":"google-oauth2","origin":"http://houston.local.astronomer.io:8871/v1/oauth/callback"}`;

    mockGetClient.issuer = {
      metadata: {
        claimsMapping: {},
        fetchUserInfo: true
      }
    };

    mockGetClient.callback = jest.fn().mockImplementation(() => {
      throw new Error();
    });

    jest.spyOn(oAuthExports, "getClient").mockImplementation(() => {
      return mockGetClient;
    });

    const res = await request(app)
      .post("/")
      .set("Cookie", [`nonce=${nonce}`])
      .send({
        id_token: jwt.sign(idToken, "test"),
        expires_in: expiresIn,
        state
      });

    expect(res.statusCode).toBe(403);
    expect(res.text).toBe("Unable to Login!");
  });

  test("Should throw error if user does not exists", async () => {
    prisma.users = jest
      .fn()
      .mockName("users")
      .mockReturnValue({
        $fragment: function() {
          return [];
        }
      });

    prisma.usersConnection = jest.fn().mockReturnValue({
      aggregate: jest.fn().mockReturnValue({
        count: jest
          .fn()
          .mockName("usersConnection")
          .mockReturnValue(0)
      })
    });

    jest.spyOn(userExports, "isFirst").mockImplementation(() => false);

    jest.spyOn(userExports, "createUser").mockImplementation(() => {
      return { id: () => 1 };
    });

    const state = `{"provider":"google","integration":"google-oauth2","origin":"http://houston.local.astronomer.io:8871/v1/oauth/callback"}`;

    mockGetClient.issuer = {
      metadata: {
        claimsMapping: {},
        fetchUserInfo: true
      }
    };
    mockGetClient.callback = () => {
      return {
        claims: jest.fn().mockReturnValue({
          email: "TESTING@google.com",
          name: "test name",
          sub: "test-sub=",
          access_token: "some-token"
        })
      };
    };
    mockGetClient.userinfo = () => {
      return {
        name: "Testing Name",
        picture: "http://www.astronomer.io/test.img"
      };
    };

    jest.spyOn(oAuthExports, "getClient").mockImplementation(() => {
      return mockGetClient;
    });

    const res = await request(app)
      .post("/")
      .set("Cookie", [`nonce=${nonce}`])
      .send({
        id_token: jwt.sign(idToken, "test"),
        expires_in: expiresIn,
        state
      });

    expect(res.statusCode).toBe(500);
  });

  test("typical request to google successfully redirects", async () => {
    mockGetClient.issuer = {
      metadata: {
        claimsMapping: {},
        fetchUserInfo: true
      }
    };
    mockGetClient.callback = () => {
      return {
        claims: jest.fn().mockReturnValue({
          email: "TESTING@google.com",
          name: "test name",
          sub: "test-sub=",
          access_token: "some-token"
        })
      };
    };
    mockGetClient.userinfo = () => {
      return {
        name: "Testing Name",
        picture: "http://www.astronomer.io/test.img"
      };
    };
    jest.spyOn(oAuthExports, "getClient").mockImplementation(() => {
      return mockGetClient;
    });
    const state = `{"provider":"google","integration":"google-oauth2","origin":"http://houston.local.astronomer.io:8871/v1/oauth/callback"}`;

    const res = await request(app)
      .post("/")
      .set("Cookie", [`nonce=${nonce}`])
      .send({
        id_token: jwt.sign(idToken, "test"),
        expires_in: expiresIn,
        state
      });

    expect(res.statusCode).toBe(302);
  });

  test("typical request to ADFS successfully redirects", async () => {
    mockGetClient.issuer = {
      metadata: {
        claimsMapping: {
          email: "upn",
          name: "upn"
        },
        fetchUserInfo: false
      }
    };
    mockGetClient.callback = () => {
      return {
        claims: jest.fn().mockReturnValue({
          upn: "TESTING@company.com",
          sub: "test-sub=",
          access_token: "some-token"
        })
      };
    };
    mockGetClient.userinfo = null;

    jest.spyOn(oAuthExports, "getClient").mockImplementation(() => {
      return mockGetClient;
    });
    const state = `{"provider":"adfs","integration":"adfs","origin":"http://houston.local.astronomer.io:8871/v1/oauth/callback"}`;

    const res = await request(app)
      .post("/")
      .set("Cookie", [`nonce=${nonce}`])
      .send({
        id_token: jwt.sign(idToken, "test"),
        expires_in: expiresIn,
        state
      });
    expect(res.statusCode).toBe(302);
  });

  test("typical request to Azure AD successfully redirects", async () => {
    mockGetClient.issuer = {
      metadata: {
        claimsMapping: {
          email: "preferred_username",
          name: "name"
        },
        fetchUserInfo: true
      }
    };
    mockGetClient.callback = () => {
      return {
        claims: jest.fn().mockReturnValue({
          preferred_username: "test@microsoft.com",
          name: "test name",
          sub: "test-sub=",
          access_token: "some-token"
        })
      };
    };
    mockGetClient.userinfo = () => {
      return {
        name: "Testing Name",
        picture: "http://www.astronomer.io/test.img"
      };
    };
    jest.spyOn(oAuthExports, "getClient").mockImplementation(() => {
      return mockGetClient;
    });
    const state = `{"provider":"microsoft","integration":"microsoft","origin":"http://houston.local.astronomer.io:8871/v1/oauth/callback"}`;

    const res = await request(app)
      .post("/")
      .set("Cookie", [`nonce=${nonce}`])
      .send({
        id_token: jwt.sign(idToken, "test"),
        expires_in: expiresIn,
        state
      });
    expect(res.statusCode).toBe(302);
  });

  test("tokenSet.claims.email missing and no fallback", async () => {
    mockGetClient.issuer = {
      metadata: {
        claimsMapping: {},
        fetchUserInfo: true
      }
    };
    mockGetClient.callback = () => {
      return {
        claims: jest.fn().mockReturnValue({
          upn: "test@example.com",
          name: "test name",
          sub: "test-sub=",
          access_token: "some-token"
        })
      };
    };
    mockGetClient.userinfo = () => {
      return {
        name: "Testing Name",
        picture: "http://www.astronomer.io/test.img"
      };
    };
    jest.spyOn(oAuthExports, "getClient").mockImplementation(() => {
      return mockGetClient;
    });
    const state = `{"provider":"example","integration":"example","origin":"http://houston.local.astronomer.io:8871/v1/oauth/callback"}`;

    const res = await request(app)
      .post("/")
      .set("Cookie", [`nonce=${nonce}`])
      .send({
        id_token: jwt.sign(idToken, "test"),
        expires_in: expiresIn,
        state
      });
    expect(res.statusCode).toBe(400);
  });

  test("invalid fallback values", async () => {
    mockGetClient.issuer = {
      metadata: {
        claimsMapping: {
          email: "email_address",
          name: "username"
        },
        fetchUserInfo: true
      }
    };
    mockGetClient.callback = () => {
      return {
        claims: jest.fn().mockReturnValue({
          upn: "test@example.com",
          sub: "test-sub=",
          access_token: "some-token",
          name: "fake",
          email: "fake@astronomer.io"
        })
      };
    };
    mockGetClient.userinfo = () => {
      return {
        name: "Testing Name",
        picture: "http://www.astronomer.io/test.img"
      };
    };

    jest.spyOn(oAuthExports, "getClient").mockImplementation(() => {
      return mockGetClient;
    });
    const state = `{"provider":"example","integration":"example","origin":"http://houston.local.astronomer.io:8871/v1/oauth/callback"}`;
    const res = await request(app)
      .post("/")
      .set("Cookie", [`nonce=${nonce}`])
      .send({
        id_token: jwt.sign(idToken, "test"),
        expires_in: expiresIn,
        state
      });
    expect(res.statusCode).toBe(400);
  });

  test("unable to parse rawState", async () => {
    const state = `%7C%22provider%22%3A%22example%22%2C%22integration%22%3A%22example%22%2C%22origin%22%3A%22http%3A%2F%2Fhouston.local.astronomer.io%3A8871%2Fv1%2Foauth%2Fcallback%22%7D`;
    const res = await request(app)
      .post("/")
      .set("Cookie", [`nonce=${nonce}`])
      .send({
        id_token: idToken,
        expires_in: expiresIn,
        state
      });

    expect(res.statusCode).toBe(400);
  });

  test("should lowercase email address coming from idp claims", async () => {
    const email = "TESTING@google.com";
    mockGetClient.issuer = {
      metadata: {
        claimsMapping: {},
        fetchUserInfo: true
      }
    };
    mockGetClient.callback = () => {
      return {
        claims: jest.fn().mockReturnValue({
          email,
          name: "test name",
          sub: "test-sub=",
          access_token: "some-token"
        })
      };
    };
    mockGetClient.userinfo = () => {
      return {
        name: "Testing Name",
        picture: "http://www.astronomer.io/test.img"
      };
    };
    jest.spyOn(oAuthExports, "getClient").mockImplementation(() => {
      return mockGetClient;
    });
    const state = `{"provider":"google","integration":"google-oauth2","origin":"http://houston.local.astronomer.io:8871/v1/oauth/callback"}`;

    const res = await request(app)
      .post("/")
      .set("Cookie", [`nonce=${nonce}`])
      .send({
        id_token: jwt.sign(idToken, "test"),
        expires_in: expiresIn,
        state
      });

    const encodedQueryParams = res.text.split("?")[1];
    const decodedQueryParams = decodeURIComponent(encodedQueryParams);
    const extras = decodedQueryParams.split("&")[0];
    const extrasData = JSON.parse(extras.split("=")[1]);
    expect(extrasData.email).toBe(email.toLowerCase());
  });
});
