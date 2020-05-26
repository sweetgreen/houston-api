import validateEnvironment from "./index";

describe("When valid environment variables are passed", () => {
  describe("it does not throw an error", () => {
    test("when env is undefined", () => {
      const goodEnvs = undefined;
      expect(validateEnvironment(goodEnvs)).toBeUndefined();
    });

    test("when env is null", () => {
      const goodEnvs = null;
      expect(validateEnvironment(goodEnvs)).toBeUndefined();
    });

    test("when env is empty", () => {
      const goodEnvs = [];
      expect(validateEnvironment(goodEnvs)).toBeUndefined();
    });

    test("when env is uppercase", () => {
      const goodEnvs = [{ key: "A", value: "" }];
      expect(validateEnvironment(goodEnvs)).toBeUndefined();
    });

    test("when env is uppercase and uses underscores", () => {
      const goodEnvs = [{ key: "GOOD_VARIABLE", value: "" }];
      expect(validateEnvironment(goodEnvs)).toBeUndefined();
    });

    test("when env is uppercase and starts and ends with underscores", () => {
      const goodEnvs = [{ key: "_STARTS_ENDS_UNDERSCORES_", value: "" }];
      expect(validateEnvironment(goodEnvs)).toBeUndefined();
    });
  });
});

describe("When invalid environment variables are passed", () => {
  test("it throws an error for helm overrides", () => {
    expect(() => {
      const badEnvs = [{ key: "AIRFLOW__CORE__EXECUTOR", value: "" }];
      validateEnvironment(badEnvs);
    }).toThrow();
  });

  test("it throws an error for invalid key formats", () => {
    expect(() => {
      const badEnvs = [{ key: "", value: "" }];
      validateEnvironment(badEnvs);
    }).toThrow();

    expect(() => {
      const badEnvs = [{ key: "_", value: "test" }];
      validateEnvironment(badEnvs);
    }).toThrow();

    expect(() => {
      const badEnvs = [{ key: "__", value: "test" }];
      validateEnvironment(badEnvs);
    }).toThrow();

    expect(() => {
      const badEnvs = [
        { key: "OTHER_SPECIAL_CHARS_!@#$%^&*()", value: "test" }
      ];
      validateEnvironment(badEnvs);
    }).toThrow();

    expect(() => {
      const badEnvs = [{ key: "ALL_UPPERCASE_EXCEPT_LAST_LETTEr", value: "" }];
      validateEnvironment(badEnvs);
    }).toThrow();

    expect(() => {
      const badEnvs = [{ key: "SELECT * FROM INVALID_KEY;", value: "" }];
      validateEnvironment(badEnvs);
    }).toThrow();

    expect(() => {
      const badEnvs = [{ key: "invalid_lowercase", value: "" }];
      validateEnvironment(badEnvs);
    }).toThrow();

    expect(() => {
      const badEnvs = [{ key: "UPPCASE WITH SPACES", value: "" }];
      validateEnvironment(badEnvs);
    }).toThrow();

    expect(() => {
      const badEnvs = [{ key: "STARTS_VALID_ENDS INVALID", value: "" }];
      validateEnvironment(badEnvs);
    }).toThrow();

    expect(() => {
      const badEnvs = [
        { key: "ONE_VALID", value: "" },
        { key: "TWO_VALID", value: "" },
        { key: "LAST IS INVALID", value: "" }
      ];
      validateEnvironment(badEnvs);
    }).toThrow();
  });
});
