import { users, deployments, invites, serviceAccounts } from "./index";
import casual from "casual";
import "graphql-binding";

// Mock addFragmentToInfo method for serviceAccounts test
jest.mock("graphql-binding", () => {
  return {
    __esModule: true,
    addFragmentToInfo: jest.fn().mockName("MockAddFragmentToInfo")
  };
});

describe("Workspace", () => {
  test("users returns an empty array", () => {
    const parent = { id: casual.uuid };
    const db = {
      query: { users: jest.fn() }
    };
    users(parent, {}, { db });
    expect(db.query.users.mock.calls).toHaveLength(1);
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
    const db = {
      query: { inviteTokens: jest.fn() }
    };
    invites(parent, {}, { db });
    expect(db.query.inviteTokens.mock.calls).toHaveLength(1);
  });

  test("serviceAccounts returns array of serviceAccounts", async () => {
    const parent = { id: casual.uuid };
    const saId = casual.uuid;
    const db = {
      query: {
        serviceAccounts: jest.fn().mockReturnValue([{ id: saId }])
      }
    };

    const sAs = await serviceAccounts(
      parent,
      { workspaceUuid: parent.id },
      { db },
      {}
    );

    expect(db.query.serviceAccounts.mock.calls).toHaveLength(1);
    expect(sAs).toHaveLength(1);
    expect(sAs[0]).toHaveProperty("id", saId);
  });
});
