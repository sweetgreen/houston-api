import validateExistence from "./index";
import { DuplicateDeploymentLabelError } from "errors";
import casual from "casual";

describe("validateExistence", () => {
  test("throws error if duplicate named deployment exists in workspace", async () => {
    const workspaceId = casual.uuid;
    const label = casual.word;

    // Set up our spy.
    const prisma = {
      deployment: {
        findMany: jest.fn().mockImplementation(() => {
          return [{ id: casual.uuid }];
        })
      }
    };

    // Call the function.
    await expect(validateExistence(prisma, workspaceId, label)).rejects.toThrow(
      new DuplicateDeploymentLabelError(label)
    );
    expect(prisma.deployment.findMany).toBeCalledWith({
      where: { deletedAt: null, label, workspace: { id: workspaceId } }
    });
  });

  test("does not throw error if updating current deployment", async () => {
    const workspaceId = casual.uuid;
    const label = casual.word;
    const deploymentId = casual.uuid;

    // Set up our spy.
    const prisma = {
      deployment: {
        findMany: jest.fn().mockImplementation(() => {
          return [{ id: deploymentId }];
        })
      }
    };

    // Call the function.
    await expect(
      validateExistence(prisma, workspaceId, label, deploymentId)
    ).resolves.not.toThrow();
    expect(prisma.deployment.findMany).toBeCalledWith({
      where: { deletedAt: null, label, workspace: { id: workspaceId } }
    });
  });

  test("throws error if different deployment in workspace has label", async () => {
    const workspaceId = casual.uuid;
    const label = casual.word;
    const deploymentId = casual.uuid;

    // Set up our spy.
    const prisma = {
      deployment: {
        findMany: jest.fn().mockImplementation(() => {
          return [{ id: casual.uuid }];
        })
      }
    };

    // Call the function.
    await expect(
      validateExistence(prisma, workspaceId, label, deploymentId)
    ).rejects.toThrow(new DuplicateDeploymentLabelError(label));
    expect(prisma.deployment.findMany).toBeCalledWith({
      where: { deletedAt: null, label, workspace: { id: workspaceId } }
    });
  });

  test("does not throw an error if no deployment found", async () => {
    const workspaceId = casual.uuid;
    const label = casual.word;
    const deploymentId = casual.uuid;

    // Set up our spy.
    const prisma = {
      deployment: {
        findMany: jest.fn().mockImplementation(() => {
          return [];
        })
      }
    };

    // Call the function.
    await expect(
      validateExistence(prisma, workspaceId, label, deploymentId)
    ).resolves.not.toThrow();
    expect(prisma.deployment.findMany).toBeCalledWith({
      where: { deletedAt: null, label, workspace: { id: workspaceId } }
    });
  });
});
