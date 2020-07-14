import router from "./index";
import { providerCfg } from "oauth/config";
import express from "express";
import request from "supertest";

// Create test application.
const app = express().use(router);

describe("POST /start", () => {
  let oldEnv;
  beforeAll(() => {
    providerCfg.google.clientId = "fake-client-id";
    oldEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env.NODE_ENV = oldEnv;
  });

  test("Test start for node env", async () => {
    const nodeEnv = ["development", "production"];
    for (const env of nodeEnv) {
      process.env.NODE_ENV = env;
      const res = await request(app).get("?provider=google");
      expect(res.statusCode).toBe(302);
    }
  });
});
