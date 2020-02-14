import * as databaseExports from "./index";

describe("databaseExports.cleanCreator", () => {

  test("test if cleanCreator function does not modify a normal username", async () => {
    const creator = "user";
    const cleaned = databaseExports.cleanCreator(creator);
    expect(cleaned).toBe(creator);
  });

  test("test if cleanCreator function strips dbserver name from azure db username", async () => {
    const creator = "user@azure-db";
    const cleaned = databaseExports.cleanCreator(creator);
    expect(cleaned).toBe("user");
  });

  test("test if getAzureDbServer function gets azure dbserver name from azure db username", async () => {
    const creator = "user@azure-db";
    const azureDbServer = databaseExports.getAzureDbServer(creator);
    expect(azureDbServer).toBe("@azure-db");
  });
});
