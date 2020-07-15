import {
  urls,
  environmentVariables,
  properties,
  deployInfo,
  serviceAccounts
} from "./index";
import "graphql-binding";
import { generateReleaseName } from "deployments/naming";
import casual from "casual";
import { AIRFLOW_EXECUTOR_DEFAULT } from "constants";

// Mock addFragmentToInfo method for serviceAccounts test
jest.mock("graphql-binding", () => {
  return {
    __esModule: true,
    addFragmentToInfo: jest.fn().mockName("MockAddFragmentToInfo")
  };
});

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

  test("environmentVariables correctly returns environmentVariables", async () => {
    const releaseName = generateReleaseName();
    const parent = { releaseName };

    // Create mock commander client.
    const commander = {
      request: jest.fn().mockReturnValue({
        secret: { data: { AIRFLOW_HOME: "/tmp" } }
      })
    };

    const enVars = await environmentVariables(parent, {}, { commander });
    expect(enVars).toHaveLength(1);
  });

  test("properties correctly returns properties", async () => {
    const parent = { extraAu: 50 };
    const ret = await properties(parent);
    expect(ret).toHaveProperty("extra_au", 50);
  });

  test("deployInfo return an latest and next tags based on dockerImages", async () => {
    const parent = { id: "testId" };
    const db = {
      query: {
        dockerImages: jest
          .fn()
          .mockReturnValue([{ tag: "deploy-1" }, { tag: "deploy-2" }]),
        deployment: jest.fn()
      }
    };
    const { latest, nextCli } = await deployInfo(parent, {}, { db });
    expect(latest).toEqual("deploy-2");
    expect(nextCli).toEqual("deploy-3");
    expect(db.query.dockerImages.mock.calls).toHaveLength(2);
    expect(db.query.deployment.mock.calls).toHaveLength(0);
  });

  test("deployInfo return current and latest and next tags based on dockerImages", async () => {
    const parent = { id: "testId" };
    const db = {
      query: {
        dockerImages: jest
          .fn()
          .mockReturnValue([{ tag: "teamcity-r4ws4" }, { tag: "deploy-1" }]),
        deployment: jest.fn()
      }
    };
    const { latest, nextCli, current } = await deployInfo(parent, {}, { db });
    expect(latest).toEqual("deploy-1");
    expect(nextCli).toEqual("deploy-2");
    expect(current).toEqual("teamcity-r4ws4");
    expect(db.query.dockerImages.mock.calls).toHaveLength(2);
    expect(db.query.deployment.mock.calls).toHaveLength(0);
  });

  test("deployInfo return an latest and next tags based on default value", async () => {
    const parent = { id: "testId" };
    const db = {
      query: {
        dockerImages: jest.fn().mockReturnValue([]),
        deployment: jest.fn().mockReturnValue({})
      }
    };
    const { latest, nextCli } = await deployInfo(parent, {}, { db });
    expect(latest).toBeUndefined();
    expect(nextCli).toEqual("deploy-1");
    expect(db.query.dockerImages.mock.calls).toHaveLength(2);
    expect(db.query.deployment.mock.calls).toHaveLength(0);
  });

  test("serviceAccounts returns array of serviceAccounts", async () => {
    const parent = { id: casual.uuid };
    const saId = casual.uuid;
    const db = {
      query: {
        serviceAccounts: jest.fn().mockReturnValue([{ id: saId }])
      }
    };

    const sAs = await serviceAccounts(
      parent,
      { deploymentUuid: parent.id },
      { db },
      {}
    );

    expect(db.query.serviceAccounts.mock.calls).toHaveLength(1);
    expect(sAs).toHaveLength(1);
    expect(sAs[0]).toHaveProperty("id", saId);
  });
});
