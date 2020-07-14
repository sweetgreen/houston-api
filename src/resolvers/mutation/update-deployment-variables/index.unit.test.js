import resolvers from "resolvers";
import { generateReleaseName } from "deployments/naming";
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
  mutation updateDeploymentVariables(
    $deploymentUuid: Uuid!,
    $releaseName: String!,
    $environmentVariables: [InputEnvironmentVariable!]!
  ) {
  updateDeploymentVariables(
    deploymentUuid: $deploymentUuid,
    releaseName: $releaseName,
    environmentVariables: $environmentVariables
  ) {
    key
    value
    isSecret
  }
}`;

describe("updateDeploymentVariables", () => {
  const deploymentUuid = casual.uuid;
  const releaseName = generateReleaseName();

  const deployment = jest.fn().mockReturnValue({
    releaseName,
    workspace: {
      id: casual.uuid,
      stripeCustomerId: casual.uuid,
      isSuspended: false
    }
  });

  const db = {
    query: { deployment }
  };

  // Create mock commander client.
  const commander = {
    request: jest.fn()
  };
  const user = { id: casual.uuid };

  test("typical request is successful", async () => {
    const vars = {
      deploymentUuid,
      releaseName,
      environmentVariables: [
        { key: "AIRFLOW__CLI__ENDPOINT_URL", value: "true", isSecret: false }
      ]
    };

    // Run the graphql mutation.
    const res = await graphql(
      schema,
      mutation,
      null,
      { db, commander, user },
      vars
    );

    expect(res.errors).toBeUndefined();
    expect(commander.request.mock.calls.length).toBe(1);
    expect(res.data.updateDeploymentVariables[0].key).toBe(
      vars.environmentVariables[0].key
    );
  });

  test("typical request is successful with isSecret true", async () => {
    const vars = {
      deploymentUuid,
      releaseName,
      environmentVariables: [
        { key: "AIRFLOW__CLI__ENDPOINT_TEST", value: "true", isSecret: false },
        {
          key: "AIRFLOW__CLI__ENDPOINT_URL",
          value: "true",
          isSecret: true
        }
      ]
    };

    // Run the graphql mutation.
    const res = await graphql(
      schema,
      mutation,
      null,
      { db, commander, user },
      vars
    );

    expect(res.errors).toBeUndefined();
    expect(commander.request.mock.calls.length).toBe(1);
    expect(res.data.updateDeploymentVariables[1].isSecret).toBe(true);
  });
});
