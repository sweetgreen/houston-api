import { schema } from "../../../schema";
import { generateReleaseName } from "deployments/naming";
import casual from "casual";
import { graphql } from "graphql";
import { AIRFLOW_EXECUTOR_DEFAULT } from "constants";

// Define our mutation
const mutation = `
  mutation upgradeDeployment(
    $deploymentUuid: Uuid!
    $version: String!
  ) {
    upgradeDeployment(
      deploymentUuid: $deploymentUuid
      version: $version
    ) {
        id
        config
        env
        urls {
          type
          url
        }
        properties
        description
        label
        releaseName
        status
        type
        version
        createdAt
        updatedAt
      }
    }
`;

describe("upgradeDeployment", () => {
  test("typical request is successful", async () => {
    const id = casual.uuid;

    // Mock up some db functions.
    const update = jest.fn().mockReturnValue({
      id,
      releaseName: generateReleaseName(),
      config: { executor: AIRFLOW_EXECUTOR_DEFAULT },
      createdAt: new Date(),
      updatedAt: new Date(),
      workspace: {
        id: casual.uuid
      }
    });

    // Construct db object for context.
    const prisma = {
      deployment: {
        update
      }
    };

    // Create mock commander client.
    const commander = {
      request: jest.fn()
    };

    // Vars for the gql mutation.
    const vars = {
      deploymentUuid: id,
      version: "10.0.1"
    };

    // Run the graphql mutation.
    const res = await graphql(
      schema,
      mutation,
      null,
      { prisma, commander },
      vars
    );

    expect(res.errors).toBeUndefined();
    expect(update.mock.calls.length).toBe(1);
    expect(res.data.upgradeDeployment.id).toBe(id);
  });
});
