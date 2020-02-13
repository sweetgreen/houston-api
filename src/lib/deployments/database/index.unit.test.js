import * as databaseExports from "./index";

describe("databaseExports.cleanCreator", () => {

  test("test that cleanCreator function does not modify a normal username", async () => {
    const creator = "user";
    const cleaned = databaseExports.cleanCreator(creator);
    expect(cleaned).toBe(creator);
  });

  test("test that cleanCreator function strips dbserver name from azure db username", async () => {
    const creator = "user@azure-db";
    const cleaned = databaseExports.cleanCreator(creator);
    expect(cleaned).toBe("user");
  });
});
