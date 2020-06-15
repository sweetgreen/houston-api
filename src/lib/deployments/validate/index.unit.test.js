import validate from "./index";
import casual from "casual";

describe("validate", () => {
  describe("throws an error", () => {
    test("when the environment keys are invalid", async () => {
      const env = [{ key: "SOME * INVALID * KEY", value: "value" }];
      const args = {
        env
      };
      const err =
        "Invalid Environment Variable Key: SOME * INVALID * KEY (use A-Z and underscores)";

      await expect(validate(null, null, args)).rejects.toThrow(err);
    });

    test("when validation label already exists", async () => {
      const workspaceId = casual.uuid;
      const label = casual.word;
      const prisma = {
        deployment: {
          findMany: jest.fn().mockImplementation(() => {
            return [{ id: casual.uuid }];
          })
        }
      };
      const env = [{ key: "SOME_VALID_KEY", value: "any value" }];
      const args = {
        env,
        label
      };
      const err = `Workspace already has a deployment named ${label}`;

      await expect(validate(prisma, workspaceId, args)).rejects.toThrow(err);
    });
  });

  describe("successfully validates", () => {
    test("when environment does not update", async () => {
      const args = {};
      await validate(null, null, args);
    });
    test("when environment updates", async () => {
      const env = [{ key: "SOME_VALID_KEY", value: "any value" }];
      const args = {
        env
      };
      await validate(null, null, args);
    });

    test("when validation label does not exists", async () => {
      const workspaceId = casual.uuid;
      const label = casual.word;
      const deploymentId = casual.uuid;
      const prisma = {
        deployment: {
          findMany: jest.fn().mockImplementation(() => {
            return [];
          })
        }
      };
      const env = [{ key: "SOME_VALID_KEY", value: "any value" }];
      const args = {
        env,
        label
      };
      await validate(prisma, workspaceId, args, deploymentId);
    });
  });
});
