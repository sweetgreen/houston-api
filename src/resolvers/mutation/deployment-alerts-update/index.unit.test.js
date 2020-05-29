import { schema } from "../../../schema";
import casual from "casual";
import { graphql } from "graphql";

// Define our mutation
const mutation = `
  mutation deploymentAlertsUpdate(
    $deploymentUuid: Uuid!
    $alertEmails: [String!]
  ) {
    deploymentAlertsUpdate(
      deploymentUuid: $deploymentUuid
      alertEmails: $alertEmails
    ) {
        id
      }
    }
`;

describe("deploymentAlertsUpdate", () => {
  test("typical request is successful", async () => {
    // Create some deployment vars.
    const id = casual.uuid;

    // Mock up some db functions.
    const update = jest.fn().mockReturnValue({
      id
    });

    const prisma = {
      deployment: { update }
    };

    // Vars for the gql mutation.
    const newAlertEmail = casual.email;
    const vars = {
      deploymentUuid: id,
      alertEmails: [newAlertEmail]
    };

    // Run the graphql mutation.
    const res = await graphql(schema, mutation, null, { prisma }, vars);
    expect(res.errors).toBeUndefined();
    expect(update.mock.calls.length).toBe(1);
    expect(res.data.deploymentAlertsUpdate.id).toBe(id);
  });
});
