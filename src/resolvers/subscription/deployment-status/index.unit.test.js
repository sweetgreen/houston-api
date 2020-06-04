import { getMetric } from "./index";
import request from "request-promise-native";
jest.mock("request");

// Null is blue, greater than 0 is green,
// and less than or equal to zero is red
describe("getMetric", () => {
  test("that a successful, empty prometheus response returns null to indicate pending (blue UI bubble)", async () => {
    request.mockReturnValue({ status: "success", data: { result: [] } });
    const releaseName = "sample-release-1234";
    const metricResponse = await getMetric(releaseName);
    expect(request).toBeCalledTimes(1);
    expect(metricResponse).toEqual(null);
  });
  test("that a successful prometheus response non-empty with value greater than zero returns a value greater than zero (green UI bubble)", async () => {
    request.mockReturnValue({
      status: "success",
      data: { result: [{ value: [1234, "1"] }] }
    });

    const releaseName = "sample-release-1234";
    const metricResponse = await getMetric(releaseName);
    expect(request).toBeCalledTimes(1);
    expect(metricResponse).toEqual("1");
  });
  test("that a successful prometheus response non-empty with value zero returns zero (red UI bubble)", async () => {
    request.mockReturnValue({
      status: "success",
      data: { result: [{ value: [1234, "0"] }] }
    });
    const releaseName = "sample-release-1234";
    const metricResponse = await getMetric(releaseName);
    expect(request).toBeCalledTimes(1);
    expect(metricResponse).toEqual("0");
  });
  test("that an unsuccessful prometheus response will return null to indicate pending (blue UI bubble). This makes sense because no information should show as pending to the user.", async () => {
    request.mockReturnValue({
      status: "error",
      data: { result: [{ value: [1234, "0"] }] }
    });
    const releaseName = "sample-release-1234";
    const metricResponse = await getMetric(releaseName);
    expect(request).toBeCalledTimes(1);
    expect(metricResponse).toEqual(null);
  });
});
