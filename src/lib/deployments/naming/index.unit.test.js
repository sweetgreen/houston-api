import {
  generateReleaseName,
  generateNamespace,
  generateEnvironmentSecretName,
  generateDeploymentLabels,
  generateDatabaseName,
  generateAirflowUsername,
  generateCeleryUsername,
  validateReleaseName
} from "./index";
import adjectives from "./adjectives";
import nouns from "./nouns";
import config from "config";

describe("deployments naming", () => {
  describe("validateReleaseName", () => {
    test("returns when valid", () => {
      const helmConfig = config.get("helm");
      const validReleaseName = validateReleaseName(helmConfig.releaseName);

      expect(validReleaseName).toBeTruthy();
    });

    test("throws when release name is invalid", () => {
      expect(() => {
        const invalidConfig = config.get("helm");
        invalidConfig.releaseName = "This shouldn't work";
        validateReleaseName(invalidConfig.releaseName);
      }).toThrow();
    });

    test("throws when prefix and release name length is greater the maximum length", () => {
      expect(() => {
        const invalidConfig = config.get("helm");
        invalidConfig.releaseName = `${generateReleaseName()}-some-extra-characters-that-are-too-long-and-go-over-the-max-char-limit`;
        validateReleaseName(invalidConfig.releaseName);
      }).toThrow();
    });
  });

  describe("generateReleaseName", () => {
    test("uses valid adjectives and nouns", () => {
      const releaseName = generateReleaseName();
      const adjFound = adjectives.join(",").search(releaseName);
      const nounFound = nouns.join(",").search(releaseName);

      expect(releaseName).toBeTruthy();
      expect(adjFound).toBeTruthy();
      expect(nounFound).toBeTruthy();
    });

    test("uses valid default token length", () => {
      const len = 4;
      const token = generateReleaseName();
      const tokenLen = token.substring(token.lastIndexOf("-") + 1).length;

      expect(tokenLen).toBe(len);
    });

    test("uses valid custom token length", () => {
      const len = 20;
      const token = generateReleaseName(len);
      const tokenLen = token.substring(token.lastIndexOf("-") + 1).length;

      expect(tokenLen).toBe(len);
    });
  });

  describe("generateNamespace", () => {
    test("contains namespace parameter", () => {
      expect(generateNamespace("planetary-nebula-1234")).toEqual(
        expect.stringMatching(/^.*-planetary-nebula-1234/)
      );
    });
  });

  describe("generateDeploymentLabels", () => {
    test("returns and empty array when using single namespace mode", () => {
      const helmConfig = config.get("helm");
      helmConfig.singleNamespace = true;

      expect(generateDeploymentLabels()).toEqual([]);
    });

    test("returns and empty array when using single namespace mode", () => {
      const helmConfig = config.get("helm");
      const deployConfig = config.get("deployments");
      const namespaceLabels = { testKey: true };
      const expectedLabels = [
        {
          key: "testKey",
          value: true
        }
      ];
      helmConfig.singleNamespace = false;
      deployConfig.namespaceLabels = namespaceLabels;

      expect(generateDeploymentLabels()).toEqual(expectedLabels);
    });
  });

  describe("generateEnvironmentSecretName", () => {
    test("appends -env to release name parameter", () => {
      const releaseName = "planetary-nebula-1234";
      expect(generateEnvironmentSecretName(releaseName)).toBe(
        `${releaseName}-env`
      );
    });
  });

  describe("generateDatabaseName", () => {
    test("replaces _ with - and appends _airflow to release name parameter", () => {
      const releaseName = "planetary-nebula-1234";
      const expectedName = "planetary_nebula_1234_airflow";
      expect(generateDatabaseName(releaseName)).toBe(expectedName);
    });
  });

  describe("generateAirflowUsername", () => {
    test("replaces _ with - and appends _airflow to release name parameter", () => {
      const releaseName = "planetary-nebula-1234";
      const expectedName = "planetary_nebula_1234_airflow";
      expect(generateAirflowUsername(releaseName)).toBe(expectedName);
    });
  });

  describe("generateCeleryUsername", () => {
    test("replaces _ with - and appends _celery to release name parameter", () => {
      const releaseName = "planetary-nebula-1234";
      const expectedName = "planetary_nebula_1234_celery";
      expect(generateCeleryUsername(releaseName)).toBe(expectedName);
    });
  });
});
