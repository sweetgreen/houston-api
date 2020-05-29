import { users, deployments, invites } from "./index";
import casual from "casual";

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
});
