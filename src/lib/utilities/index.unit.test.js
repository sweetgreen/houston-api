import {
  parseJSON,
  getCookieName,
  version,
  scheme,
  houston,
  ui
} from "./index";
import config from "config";

describe("parseJSON", () => {
  test("correctly parses a valid JSON object", () => {
    const str = '{"something":"somevalue"}';
    const res = parseJSON(str);
    expect(res).toHaveProperty("something", "somevalue");
  });

  test("correctly parses a valid JSON array", () => {
    const str = '["someone@somewhere.com"]';
    const res = parseJSON(str);
    expect(res).toHaveLength(1);
  });

  test("correctly returns a non JSON string", () => {
    const str = "someone@somewhere.com";
    const res = parseJSON(str);
    expect(res).toBe(str);
  });
});

describe("getCookieName", () => {
  test("correctly sets a cookie name", () => {
    config.helm.baseDomain = "datarouter.ai";
    const name = getCookieName();
    expect(name).toBe("astronomer_datarouter_ai_auth");
  });
});

describe("version", () => {
  test("version is correctly set by config", () => {
    expect(version()).toEqual("v1");
  });
});

describe("scheme", () => {
  test("scheme is correctly set by environment", () => {
    expect(scheme()).toEqual("http");
  });
});

describe("houston", () => {
  test("houston url is generated successfully", () => {
    expect(houston()).toContain("houston.");
  });
});

describe("ui", () => {
  test("ui url is generated successfully", () => {
    expect(ui()).toContain("app.");
  });
});
