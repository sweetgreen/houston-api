import { createAuthJWT, setJWTCookie, createJWS } from "./index";
import jws from "jws";
import casual from "casual";

describe("createAuthJWT", () => {
  test("successfully creates a jwt for a userId", () => {
    const id = casual.uuid;
    const token = createAuthJWT(id);
    expect(token).toHaveProperty("token");
    expect(token).toHaveProperty("payload");
    expect(token.payload.uuid).toBe(id);
    expect(token.payload.iat).toBeDefined();
    expect(token.payload.exp).toBeGreaterThan(Math.floor(new Date() / 1000));
  });
});

describe("createJWS", () => {
  test("successfully creates a jws token", () => {
    const word = casual.word;
    const token = createJWS(word);
    const decoded = jws.decode(token);
    expect(decoded).toHaveProperty("header");
    expect(decoded).toHaveProperty("payload");
    expect(decoded).toHaveProperty("signature");
    expect(decoded.payload).toBe(word);
  });
});

describe("setJWTCookie", () => {
  test("successfully sets cookie on http response", () => {
    const response = { cookie: jest.fn() };
    const { token } = createAuthJWT(casual.uuid);
    setJWTCookie(response, token);
    expect(response.cookie.mock.calls).toHaveLength(1);
  });
});
