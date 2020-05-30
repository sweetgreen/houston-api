import validateProperties from "./index";
import { InvalidDeploymentError } from "errors";

describe("validateProperties", () => {
  test("throws error if deployment property is invalid", async () => {
    const property = {
      comp_version: "0.0.0"
    };
    expect(() => {
      validateProperties(property);
    }).toThrow(
      new InvalidDeploymentError(
        "comp_version is not a valid deployment property"
      )
    );
  });

  test("does not throw error if deployment property is valid", async () => {
    const property = {
      component_version: "0.0.0"
    };
    expect(validateProperties(property)).toBeUndefined();
  });
});
