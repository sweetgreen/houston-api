import {
  createDatabaseForDeployment,
  removeDatabaseForDeployment,
  createConnection,
  ensureDatabase,
  ensureUser,
  ensureSchema,
  ensureUserAndSchema,
  parseConnection
} from "./index";
import { generateReleaseName } from "deployments/naming";
import config from "config";
import casual from "casual";

describe("deployments database", () => {
  const id = casual.uuid;
  const workspace = { id };
  const releaseName = generateReleaseName();
  const deployment = {
    id,
    releaseName,
    workspace
  };

  describe("createDatabaseForDeployment", () => {
    test("correctly creates deployment", async () => {
      await createDatabaseForDeployment(deployment);
    });
  });

  describe("removeDatabaseForDeployment", () => {
    test("correctly removes database for deployment", async () => {
      await removeDatabaseForDeployment(deployment);
    });
  });

  describe("parseConnection", () => {
    test("correctly parses connection", async () => {
      const conn = "postgres://someuser:somepassword@somehost:381/somedatabase";
      const parsedConn = parseConnection(conn);
      const { user, password, port, host, database } = parsedConn;

      expect(user).toEqual("someuser");
      expect(password).toEqual("somepassword");
      expect(port).toEqual("381");
      expect(host).toEqual("somehost");
      expect(database).toEqual("somedatabase");
    });
  });

  describe("queries", () => {
    const { connection } = config.get("database");
    const parsedConn = parseConnection(connection);

    describe("createConnection", () => {
      test("correctly connects to db", () => {
        const conn = createConnection(parsedConn);
        conn.destroy();
      });
    });

    describe("ensureDatabase", () => {
      test("correctly ensure database exists", async () => {
        const conn = createConnection(parsedConn);

        await ensureDatabase(conn, "testing");
        conn.destroy();
      });
    });

    describe("ensureUser", () => {
      test("correctly connects to db", async () => {
        const conn = createConnection(parsedConn);
        const { user, password } = parsedConn;

        await ensureUser(conn, user, password);
        conn.destroy();
      });
    });

    describe("ensureSchema", () => {
      test("creates a new schema if it does not already exist.", async () => {
        const schema = "houstonTestingSchema";
        const { user } = parsedConn;
        const conn = createConnection(parsedConn);

        await conn.raw(`DROP SCHEMA IF EXISTS ${schema}`);
        await ensureSchema(conn, schema, user);
        await conn.raw(`DROP SCHEMA IF EXISTS ${schema}`);
        conn.destroy();
      });
    });

    describe("ensureUserAndSchema", () => {
      test("creates a new schema if it does not already exist.", async () => {
        const conn = createConnection(parsedConn);
        const { user, password } = parsedConn;
        const schema = "houstonTestingSchema";
        const creator = "houstonTestingRole";
        const allowRootAccess = false;

        await conn.raw(`DROP SCHEMA IF EXISTS ${schema}`);
        await conn.raw(`DROP ROLE IF EXISTS ${creator}`);
        await conn.raw(`CREATE ROLE ${creator}`);
        await ensureUserAndSchema(
          conn,
          schema,
          user,
          password,
          creator,
          allowRootAccess
        );
        await conn.raw(`DROP SCHEMA IF EXISTS ${schema}`);
        await conn.raw(`DROP ROLE IF EXISTS ${creator}`);
        conn.destroy();
      });
    });
  });
});
