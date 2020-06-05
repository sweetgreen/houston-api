import validateDeploymentCredentials from "./index";

describe("validateDeploymentCredentials", () => {
  test("return false when invalid release name", async () => {
    const releaseName = "-t-t-t-t-t";
    const passowrd = "passowrd";
    expect(await validateDeploymentCredentials(releaseName, passowrd)).toBe(
      false
    );
  });
  test("return false when invalid release name ----", async () => {
    const releaseName = "----";
    const passowrd = "passowrd";
    expect(await validateDeploymentCredentials(releaseName, passowrd)).toBe(
      false
    );
  });
});
