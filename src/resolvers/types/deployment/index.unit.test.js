import { urls, env, properties, deployInfo } from "./index";
import { generateReleaseName } from "deployments/naming";
import { AIRFLOW_EXECUTOR_DEFAULT } from "constants";

describe("Deployoment", () => {
  test("urls returns correct urls", () => {
    const releaseName = generateReleaseName();
    const config = { executor: AIRFLOW_EXECUTOR_DEFAULT };
    const parent = { config, releaseName };
    const theUrls = urls(parent);

    expect(theUrls).toHaveLength(2);

    expect(theUrls[0]).toHaveProperty("type", "airflow");
    expect(theUrls[0]).toHaveProperty("url");
    expect(theUrls[0].url).toEqual(expect.stringContaining(releaseName));

    expect(theUrls[1]).toHaveProperty("type", "flower");
    expect(theUrls[1]).toHaveProperty("url");
    expect(theUrls[1].url).toEqual(expect.stringContaining(releaseName));
  });

  test("env correctly returns envs", async () => {
    const releaseName = generateReleaseName();
    const parent = { releaseName };

    // Create mock commander client.
    const commander = {
      request: jest.fn().mockReturnValue({
        secret: { data: { AIRFLOW_HOME: "/tmp" } }
      })
    };

    const envs = await env(parent, {}, { commander });
    expect(envs).toHaveLength(1);
  });

  test("properties correctly returns properties", async () => {
    const parent = { extraAu: 50 };
    const ret = await properties(parent);
    expect(ret).toHaveProperty("extra_au", 50);
  });

  test("deployInfo return an latest and next tags based on dockerImages", async () => {
    const parent = { id: "testId" };
    const prisma = {
      dockerImage: {
        findMany: jest
          .fn()
          .mockReturnValue([{ tag: "deploy-1" }, { tag: "deploy-2" }])
      },
      deployment: { findOne: jest.fn() }
    };
    const { latest, nextCli } = await deployInfo(parent, {}, { prisma });
    expect(latest).toEqual("deploy-2");
    expect(nextCli).toEqual("deploy-3");
    expect(prisma.dockerImage.findMany.mock.calls).toHaveLength(2);
    expect(prisma.deployment.findOne.mock.calls).toHaveLength(0);
  });

  test("deployInfo return current and latest and next tags based on dockerImages", async () => {
    const parent = { id: "testId" };
    const prisma = {
      dockerImage: {
        findMany: jest
          .fn()
          .mockReturnValue([{ tag: "teamcity-r4ws4" }, { tag: "deploy-1" }])
      },
      deployment: { findOne: jest.fn() }
    };
    const { latest, nextCli, current } = await deployInfo(
      parent,
      {},
      { prisma }
    );
    expect(latest).toEqual("deploy-1");
    expect(nextCli).toEqual("deploy-2");
    expect(current).toEqual("teamcity-r4ws4");
    expect(prisma.dockerImage.findMany.mock.calls).toHaveLength(2);
    expect(prisma.deployment.findOne.mock.calls).toHaveLength(0);
  });

  test("deployInfo return an latest and next tags based on default value", async () => {
    const parent = { id: "testId" };
    const prisma = {
      dockerImage: {
        findMany: jest.fn().mockReturnValue([])
      },
      deployment: { findOne: jest.fn().mockReturnValue({}) }
    };
    const { latest, nextCli } = await deployInfo(parent, {}, { prisma });
    expect(latest).toBeUndefined();
    expect(nextCli).toEqual("deploy-1");
    expect(prisma.dockerImage.findMany.mock.calls).toHaveLength(2);
    expect(prisma.deployment.findOne.mock.calls).toHaveLength(0);
  });
});
