import { mergeEnvVariables } from "./index";

describe("mergeEnvVariables", () => {
  test("successfully merges old env variable KEY_1 (non secret) with new KEY_2 (non secret)", async () => {
    const currentVars = [
      {
        key: "KEY_1",
        value: "VAL_1",
        isSecret: false
      }
    ];
    const newVars = [
      {
        key: "KEY_2",
        value: "VAL_2",
        isSecret: false
      }
    ];

    const mergedVars = [
      {
        key: "KEY_2",
        value: "VAL_2",
        isSecret: false
      }
    ];
    expect(await mergeEnvVariables(currentVars, newVars)).toEqual(mergedVars);
  });

  test("successfully merges old env variable KEY_1 (non secret) with new KEY_2 (secret)", async () => {
    const currentVars = [
      {
        key: "KEY_1",
        value: "VAL_1",
        isSecret: false
      }
    ];
    const newVars = [
      {
        key: "KEY_2",
        value: "VAL_2",
        isSecret: true
      }
    ];

    const mergedVars = [
      {
        key: "KEY_2",
        value: "VAL_2",
        isSecret: true
      }
    ];
    expect(await mergeEnvVariables(currentVars, newVars)).toEqual(mergedVars);
  });

  test("successfully merges old env variable KEY_1 (secret) with new KEY_2 (non secret)", async () => {
    const currentVars = [
      {
        key: "KEY_1",
        value: "VAL_1",
        isSecret: true
      }
    ];
    const newVars = [
      {
        key: "KEY_2",
        value: "VAL_2",
        isSecret: false
      }
    ];

    const mergedVars = [
      {
        key: "KEY_2",
        value: "VAL_2",
        isSecret: false
      }
    ];
    expect(await mergeEnvVariables(currentVars, newVars)).toEqual(mergedVars);
  });

  test("successfully merges old env variable KEY_1 (secret) with new KEY_2 (non secret) with same value", async () => {
    const currentVars = [
      {
        key: "KEY_1",
        value: "",
        isSecret: true
      }
    ];
    const newVars = [
      {
        key: "KEY_2",
        value: "VAL",
        isSecret: false
      }
    ];

    const mergedVars = [
      {
        key: "KEY_2",
        value: "VAL",
        isSecret: false
      }
    ];
    expect(await mergeEnvVariables(currentVars, newVars)).toEqual(mergedVars);
  });

  test("successfully merges old env variable KEY_1 (secret) with new KEY_2 (secret) without new value", async () => {
    const currentVars = [
      {
        key: "KEY_1",
        value: "VAL",
        isSecret: true
      }
    ];
    const newVars = [
      {
        key: "KEY_1",
        value: "",
        isSecret: true
      }
    ];

    const mergedVars = [
      {
        key: "KEY_1",
        value: "VAL",
        isSecret: true
      }
    ];
    expect(await mergeEnvVariables(currentVars, newVars)).toEqual(mergedVars);
  });
});
