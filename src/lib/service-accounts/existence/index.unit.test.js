import validateExistence from "./index";
import { DuplicateServiceAccountLabelError } from "errors";
import * as exports from "generated/client";
import casual from "casual";

describe("validateServiceAccountExistence", () => {
  test("does not throw an error if no service account with name found (workspace scope)", async () => {
    const workspaceUuid = casual.uuid;
    const label = casual.word;

    const serviceAccounts = () => ({
      roleBinding: () => ({
        workspace: () => null
      })
    });

    // Set up our spy.
    jest
      .spyOn(exports.prisma, "serviceAccounts")
      .mockImplementation(serviceAccounts);

    // Call the function.
    await expect(
      validateExistence({ label, workspaceUuid })
    ).resolves.not.toThrow();

    expect(exports.prisma.serviceAccounts).toBeCalledWith({
      where: { label }
    });
  });

  test("throws error if duplicate named service account exists (workspace scope)", async () => {
    const workspaceUuid = casual.uuid;
    const label = casual.word;

    const serviceAccounts = () => ({
      roleBinding: () => ({
        workspace: () => [
          {
            roleBinding: { workspace: { id: workspaceUuid } }
          }
        ]
      })
    });

    // Set up our spy.
    jest
      .spyOn(exports.prisma, "serviceAccounts")
      .mockImplementation(serviceAccounts);

    // Call the function.
    await expect(validateExistence({ label, workspaceUuid })).rejects.toThrow(
      new DuplicateServiceAccountLabelError(label)
    );
  });

  test("does not throw an error if no service account with name found (deployment scope)", async () => {
    const deploymentUuid = casual.uuid;
    const label = casual.word;

    const serviceAccounts = () => ({
      roleBinding: () => ({
        deployment: () => null
      })
    });

    // Set up our spy.
    jest
      .spyOn(exports.prisma, "serviceAccounts")
      .mockImplementation(serviceAccounts);

    // Call the function.
    await expect(
      validateExistence({ label, deploymentUuid })
    ).resolves.not.toThrow();

    expect(exports.prisma.serviceAccounts).toBeCalledWith({
      where: { label }
    });
  });

  test("throws error if duplicate named service account exists (deployment scope)", async () => {
    const deploymentUuid = casual.uuid;
    const label = casual.word;

    const serviceAccounts = () => ({
      roleBinding: () => ({
        deployment: () => [
          {
            roleBinding: { deployment: { id: deploymentUuid } }
          }
        ]
      })
    });

    // Set up our spy.
    jest
      .spyOn(exports.prisma, "serviceAccounts")
      .mockImplementation(serviceAccounts);

    // Call the function.
    await expect(validateExistence({ label, deploymentUuid })).rejects.toThrow(
      new DuplicateServiceAccountLabelError(label)
    );
  });
});
