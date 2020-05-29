import router from "./index";
import request from "supertest";
import express from "express";

// Create test application.
const app = express().use(router);

describe.skip("POST /oauth", () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("typical request to google is successful", async () => {
    // Mock of our usersConnection function.
    const usersConnection = function() {
      return {
        aggregate() {
          return {
            count() {
              return 0;
            }
          };
        }
      };
    };

    // Set up our spy.
    jest
      .spyOn(exports.prisma, "usersConnection")
      .mockImplementation(usersConnection);

    // Intercept request to Google
    // nock();

    const res = await request(app)
      .post("/")
      .send({
        id_token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        expires_in: 50000,
        state: {
          provider: "google"
        }
      });
    expect(res.statusCode).toBe(200);
  });
});
