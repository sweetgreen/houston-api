import { role } from "./index";
import { WORKSPACE_ADMIN } from "constants";

describe("role", () => {
  test("should return default role if no parent role is specified", async () => {
    const parent = {
      hello: "world"
    };
    const userRole = await role(parent);
    expect(userRole).toBe(WORKSPACE_ADMIN);
  });

  test("should return parent role if parent role is specified", async () => {
    const parentRole = "admin";
    const parent = {
      role: "admin"
    };
    const userRole = await role(parent);
    expect(userRole).toBe(parentRole);
  });
});
