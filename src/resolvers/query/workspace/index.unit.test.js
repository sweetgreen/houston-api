import resolvers from "resolvers";
import casual from "casual";
import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import { importSchema } from "graphql-import";
import { WORKSPACE_ADMIN } from "constants";

// Import our application schema
const schema = makeExecutableSchema({
  typeDefs: importSchema("src/schema.graphql"),
  resolvers
});

// Define our query
const query = `
  query workspace(
    $workspaceUuid: Uuid!
  ) {
    workspace(
      workspaceUuid: $workspaceUuid
    ) {
      id
      users {
        id
        roleBindings {
          role
        }
      }
    }
  }
`;

describe("workspace", () => {
  test("typical request is successful", async () => {
    const workspaceId = casual.uuid;
    // Mock up some db functions.
    const workspace = jest.fn().mockReturnValue({
      id: workspaceId
    });

    const user = {
      id: casual.uuid,
      roleBindings: [
        {
          role: WORKSPACE_ADMIN,
          workspace: { id: workspaceId }
        }
      ]
    };

    const users = jest.fn().mockReturnValue([user]);

    // Construct db object for context.
    const db = {
      query: { workspace, users }
    };

    const vars = {
      workspaceUuid: workspaceId
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { db, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(workspace).toHaveBeenCalledTimes(1);
    expect(res).toHaveProperty(["data", "workspace", "id"], workspaceId);
  });

  test("request fails if missing an argument", async () => {
    // Run the graphql mutation.
    const res = await graphql(schema, query, null, {}, {});
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].message).toEqual(
      expect.stringContaining("was not provided")
    );
  });
});
