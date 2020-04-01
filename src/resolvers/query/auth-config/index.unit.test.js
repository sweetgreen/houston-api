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
const query = `
  query authConfig(
    $redirect: String
    $duration: Int
    $extras: JSON
    $inviteToken: String
  ) {
    authConfig(
      redirect: $redirect
      duration: $duration
      extras: $extras
      inviteToken: $inviteToken
    ) {
      publicSignup
      externalSignupUrl
      initialSignup
      localEnabled
      googleEnabled
      githubEnabled
      auth0Enabled
      googleOAuthUrl
      githubOAuthUrl
      auth0OAuthUrl
    }
  }
`;

describe("authConfig", () => {
  test("typical request is successful", async () => {
    // Const password = casual.password;
    // const hash = await bcrypt.hash(password, 10);
    // const usr = { id: 0, status: "", localCredential: { password: hash } };

    // Mock up some db functions.
    // const users = jest.fn().mockReturnValue([usr]);
    // const user = jest.fn().mockReturnValue(usr);

    // Construct db object for context.
    const db = {
      query: {}
    };

    // Vars for the gql mutation.
    const vars = {
      identity: casual.email
    };

    // Run the graphql mutation.
    await graphql(schema, query, null, { db }, vars);

    // Expect(users.mock.calls.length).toBe(1);
    // expect(cookie.mock.calls.length).toBe(1);
    // expect(res.data.createToken.token.payload.iat).toBe(
    //   Math.floor(new Date() / 1000)
    // );
    // expect(res.data.createToken.token.payload.exp).toBeGreaterThan(
    //   Math.floor(new Date() / 1000)
    // );
  });
});
