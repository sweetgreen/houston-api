import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our query
const query = `
  query self {
    self {
      user {
        id
      }
    }
  }
`;

describe("self", () => {
  test("typical request is successful", async () => {
    // Const password = casual.password;
    // const hash = await bcrypt.hash(password, 10);
    const usr = { id: casual.uuid };

    // Mock up some db functions.
    // const users = jest.fn().mockReturnValue([usr]);
    const findOne = jest.fn().mockReturnValue(usr);

    // Construct db object for context.
    const prisma = {
      user: {
        findOne
      }
    };

    // Run the graphql mutation.
    const res = await graphql(schema, query, null, { prisma, user: usr });
    expect(res.errors).toBeUndefined();
    expect(findOne.mock.calls.length).toBe(1);
  });
});
