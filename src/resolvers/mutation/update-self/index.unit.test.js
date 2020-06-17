import resolvers from "resolvers";
import casual from "casual";
import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import { importSchema } from "graphql-import";

// Import our application schema
const schema = makeExecutableSchema({
  typeDefs: importSchema("src/schema.graphql"),
  resolvers
});

// Define our mutation
const mutation = `
  mutation updateSelf(
    $payload: JSON!
  ) {
    updateSelf(
      payload: $payload,
    ) {
      id
      username
      profile {
        key
        value
      }
    }
  }
`;

describe("updateSelf", () => {
  test("typical request is successful", async () => {
    // Mock up a user.
    const user = { id: casual.uuid };

    // Mock up some functions.
    const updateUser = jest.fn();

    // Construct db object for context.
    const db = {
      mutation: { updateUser }
    };

    // Vars for the gql mutation.
    const vars = {
      payload: { fullName: casual.full_name }
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { db, user }, vars);
    expect(res.errors).toBeUndefined();
    expect(updateUser.mock.calls).toHaveLength(1);
  });
});
