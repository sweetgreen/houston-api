import logs from "./index";
import * as searchLogs from "../../../lib/deployments/logs";
import casual from "casual";

describe("logs", () => {
  const deploymentUuid = casual.uuid;
  const timestamp = new Date();
  const component = "test";
  const releaseName = "test-release";
  const args = {
    deploymentUuid,
    timestamp,
    component
  };
  const prisma = {
    deployment: {
      findOne: jest.fn().mockReturnValue({
        releaseName
      })
    }
  };

  test("should return an array of mocked logs", async () => {
    const log = await logs({}, args, { prisma });
    log.forEach(line => {
      expect(line.release).toBe(releaseName);
      expect(line.component).toBe(component);
    });
  });

  test("should return an array of mocked logs when no timestamp is sent", async () => {
    const args = {
      deploymentUuid,
      component
    };

    const log = await logs({}, args, { prisma });
    log.forEach(line => {
      expect(line.release).toBe(releaseName);
      expect(line.component).toBe(component);
    });
  });

  test("should return an empty array of logs", async () => {
    // Override to mock empty response
    jest.spyOn(searchLogs, "search").mockReturnValue();

    const log = await logs({}, args, { prisma });
    expect(log).toHaveLength(0);
  });
});
