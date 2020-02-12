import * as indexExports from "./index";
import { prisma } from "generated/client";
import nock from "nock";

jest.mock("generated/client", () => {
  return {
    __esModule: true,
    prisma: jest.fn().mockName("MockPrisma")
  };
});

describe("getPlatformReleases", () => {
  afterEach(() => {
    nock.cleanAll();
  });

  test("when stubbed with 200 OK response", async () => {
    const releasesResponse = {
      version: 5,
      available_releases: [
        {
          version: "0.0.1",
          url: "https://astronomer.io/cea/release-notes/{new_version}.html",
          level: "bug_fix"
        }
      ]
    };
    nock("http://updates.test.com/")
      .get("/astronomer-platform")
      .reply(200, releasesResponse);
    await expect(
      indexExports.getPlatformReleases(
        "http://updates.test.com/astronomer-platform"
      )
    ).resolves.toEqual([
      {
        level: "bug_fix",
        url: "https://astronomer.io/cea/release-notes/{new_version}.html",
        version: "0.0.1"
      }
    ]);
  });
});

describe("updatePlatformReleases", () => {
  afterEach(() => {
    nock.cleanAll();
  });

  test("when new platform releases", async () => {
    const releasesResponse = {
      version: 5,
      available_releases: [
        {
          version: "0.0.1",
          url: "https://astronomer.io/cea/release-notes/{new_version}.html",
          level: "bug_fix"
        },
        {
          version: "0.0.2",
          url: "https://astronomer.io/cea/release-notes/{new_version}.html",
          level: "bug_fix123"
        }
      ]
    };
    nock("http://updates.test.com/")
      .get("/astronomer-platform")
      .reply(200, releasesResponse);

    prisma.platformReleases = jest
      .fn()
      .mockName("platformReleases")
      .mockReturnValue([{ version: "0.0.1" }]);

    prisma.upsertPlatformRelease = jest
      .fn()
      .mockName("upsertPlatformRelease")
      .mockReturnValue({});

    await indexExports.updatePlatformReleases(
      "http://updates.test.com/astronomer-platform"
    );

    expect(prisma.upsertPlatformRelease).toHaveBeenCalledTimes(2);
  });
});
