import * as indexExports from "./index";
import * as prismaExports from "@prisma/client";
import nock from "nock";

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

    const upsert = jest.fn().mockReturnValue({});

    jest.spyOn(prismaExports, "PrismaClient").mockImplementation(() => {
      return {
        disconnect: jest.fn(),
        platformRelease: {
          findMany: jest.fn(),
          upsert
        }
      };
    });

    await indexExports.updatePlatformReleases(
      "http://updates.test.com/astronomer-platform"
    );

    expect(upsert).toHaveBeenCalledTimes(2);
  });
});
