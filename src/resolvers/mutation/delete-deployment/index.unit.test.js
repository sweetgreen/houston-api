import { schema } from "../../../schema";
import { generateReleaseName } from "deployments/naming";
import casual from "casual";
import config from "config";
import { graphql } from "graphql";

// Define our mutation
const mutation = `
  mutation deleteDeployment(
    $deploymentUuid: Uuid!
  ) {
    deleteDeployment(
      deploymentUuid: $deploymentUuid
    ) {
        id
    }
  }
`;

describe("deleteDeployment", () => {
  let id, update, prisma, commander, vars, user;

  beforeEach(() => {
    // Create some deployment vars.
    id = casual.uuid;

    // Mock up some db functions.
    update = jest.fn().mockReturnValue({
      id,
      releaseName: generateReleaseName()
    });

    // Construct db object for context.
    prisma = {
      deployment: { update }
    };

    // Mock up a user object for context
    user = { id: casual.uuid };

    // Create mock commander client.
    commander = {
      request: jest.fn()
    };

    // Vars for the gql mutation.
    vars = {
      deploymentUuid: id
    };
  });

  describe("in normal mode", () => {
    test("typical request is successful", async () => {
      // Run the graphql mutation.
      const res = await graphql(
        schema,
        mutation,
        null,
        { prisma, commander, user },
        vars
      );

      expect(res.errors).toBeUndefined();
      expect(update).toBeCalledTimes(1);
      expect(update).toBeCalledWith({
        data: { deletedAt: expect.any(Date) },
        where: { id }
      });
      expect(commander.request.mock.calls.length).toBe(1);
      expect(commander.request.mock.calls[0][0]).toBe("deleteDeployment");
      expect(commander.request.mock.calls[0][1].deleteNamespace).toBe(true);
      expect(res.data.deleteDeployment.id).toBe(id);
    });
  });
  describe("in singleNamespace mode", () => {
    beforeAll(() => (config.helm.singleNamespace = true));
    afterAll(() => (config.helm.singleNamespace = false));
    test("typical request is successful", async () => {
      // Run the graphql mutation.
      const res = await graphql(
        schema,
        mutation,
        null,
        { prisma, commander, user },
        vars
      );

      expect(res.errors).toBeUndefined();
      expect(update).toBeCalledTimes(1);
      expect(update).toBeCalledWith({
        data: { deletedAt: expect.any(Date) },
        where: { id }
      });
      expect(commander.request.mock.calls.length).toBe(1);
      expect(commander.request.mock.calls[0][0]).toBe("deleteDeployment");
      expect(commander.request.mock.calls[0][1].deleteNamespace).toBe(false);
      expect(res.data.deleteDeployment.id).toBe(id);
    });
  });
});
