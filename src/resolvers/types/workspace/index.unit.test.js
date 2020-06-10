import {
  users,
  deployments,
  invites,
  workspaceCapabilities,
  billingEnabled,
  paywallEnabled
} from "./index";
import casual from "casual";

function createMockUser() {
  const id = casual.uuid;
  const workspace = { id };
  const role = "WORKSPACE_VIEWER";
  const roleBindings = [{ role, workspace }];
  return {
    id,
    roleBindings
  };
}

describe("Workspace", () => {
  test("users returns an empty array", () => {
    const parent = { id: casual.uuid };
    const prisma = {
      user: { findMany: jest.fn() }
    };
    users(parent, {}, { prisma });
    expect(prisma.user.findMany.mock.calls).toHaveLength(1);
  });

  test("deployments returns array of deployments", () => {
    const parent = { deployments: [{ id: casual.uuid, deletedAt: null }] };
    const deps = deployments(parent);
    expect(deps).toHaveLength(1);
  });

  test("deployments returns empty array when no deployments", () => {
    const parent = {};
    const deps = deployments(parent);
    expect(deps).toHaveLength(0);
  });

  test("deployments returns empty array when there is a single deleted deployment", () => {
    const parent = {
      deployments: [{ id: casual.uuid, deletedAt: new Date() }]
    };
    const deps = deployments(parent);
    expect(deps).toHaveLength(0);
  });

  test("invites queries invites with parent workspace id", () => {
    const parent = { id: casual.uuid };
    const prisma = {
      inviteToken: { findMany: jest.fn() }
    };
    invites(parent, {}, { prisma });
    expect(prisma.inviteToken.findMany.mock.calls).toHaveLength(1);
  });

  test("should return array of flags with workspace capabilities", () => {
    const parent = { id: casual.uuid };
    const user = createMockUser();

    const result = workspaceCapabilities(parent, {}, { user });
    const resultArray = Object.keys(result);
    expect(resultArray).toHaveLength(12);
  });

  test("should return true if billing is enabled", () => {
    const billing = billingEnabled();
    expect(billing).toBeTruthy();
  });

  test("should return true if a user is blocked from viewing their workspace", async () => {
    const parent = { id: casual.uuid };
    const trialEndsAt = new Date();
    const isSuspended = true;

    const workspace = {
      trialEndsAt,
      isSuspended
    };

    const prisma = {
      workspace: { findOne: jest.fn().mockReturnValue(workspace) }
    };
    const paywallEnabledValue = await paywallEnabled(parent, {}, { prisma });
    expect(prisma.workspace.findOne.mock.calls).toHaveLength(1);
    expect(paywallEnabledValue).toBeTruthy();
  });

  test("should return false if a user is not blocked from viewing their workspace", async () => {
    const id = casual.uuid;
    const parent = { id };
    const trialEndsAt = new Date();
    const isSuspended = false;
    const stripeCustomerId = id;
    const workspace = {
      trialEndsAt,
      isSuspended,
      stripeCustomerId
    };

    const prisma = {
      workspace: { findOne: jest.fn().mockReturnValue(workspace) }
    };
    const paywallEnabledValue = await paywallEnabled(parent, {}, { prisma });
    expect(prisma.workspace.findOne.mock.calls).toHaveLength(1);
    expect(paywallEnabledValue).toBeFalsy();
  });
});
