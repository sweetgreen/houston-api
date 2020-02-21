import * as databaseExports from "./index";

describe("databaseExports.cleanCreator", () => {
  test("test if cleanCreator function does not modify a normal username", async () => {
    const creator = "user";
    const cleaned = databaseExports.cleanCreator(creator);
    expect(cleaned).toBe(creator);
  });

  test("test if cleanCreator function does not modify a normal username", async () => {
    const creator = "my-u$3r";
    const cleaned = databaseExports.cleanCreator(creator);
    expect(cleaned).toBe(creator);
  });

  test("test if cleanCreator function strips dbserver name from azure db username", async () => {
    const creator = "user@azure-db";
    const cleaned = databaseExports.cleanCreator(creator);
    expect(cleaned).toBe("user");
  });
  
  test("test if cleanCreator function strips dbserver name from azure db username", async () => {
    const creator = "my-u$3r@azure-db";
    const cleaned = databaseExports.cleanCreator(creator);
    expect(cleaned).toBe("my-u$3r");
  });

  test("test if getDbServer function gets azure dbserver name from azure db username", async () => {
    const creator = "user@azure-db";
    const azureDbServer = databaseExports.getDbServer(creator);
    expect(azureDbServer).toBe("@azure-db");
  });

  test("test if getDbServer function gets azure dbserver name from azure db username", async () => {
    const creator = "my-u$3r@azure-db";
    const azureDbServer = databaseExports.getDbServer(creator);
    expect(azureDbServer).toBe("@azure-db");
  });

  test("test if getDbServer function returns empty string for normal user", async () => {
    const creator = "user";
    const azureDbServer = databaseExports.getDbServer(creator);
    expect(azureDbServer).toBe("");
  });

  test("test if getDbServer function returns empty string for normal user", async () => {
    const creator = "my-u$3r";
    const azureDbServer = databaseExports.getDbServer(creator);
    expect(azureDbServer).toBe("");
  });
});


