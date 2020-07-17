import {
  generateDatabaseName,
  generateAirflowUsername,
  generateCeleryUsername
} from "deployments/naming";
import log from "logger";
import knex from "knex";
import { clone, first, isString, merge } from "lodash";
import config from "config";
import passwordGenerator from "generate-password";
import { parse } from "pg-connection-string";

/*
 * Create a new database for a given deployment
 * @param {Object} deployment The deployment this database is for.
 */
export async function createDatabaseForDeployment(deployment) {
  const { allowRootAccess, enabled, connection } = config.get(
    "deployments.database"
  );

  // Exit early if we have database creation disabled.
  if (!enabled) {
    log.info("Deployment database creation disabled, skipping");
    return {};
  }

  // Parse the connection into a standard format.
  const parsedConn = parseConnection(connection);

  // Create connection as root user.
  const rootConn = createConnection(parsedConn);

  // Generate some data.
  const dbName = generateDatabaseName(deployment.releaseName);
  const airflowSchemaName = "airflow";
  const celerySchemaName = "celery";
  const airflowUserName = generateAirflowUsername(deployment.releaseName);
  const celeryUserName = generateCeleryUsername(deployment.releaseName);
  const airflowPassword = passwordGenerator.generate({
    length: 32,
    numbers: true
  });
  const celeryPassword = passwordGenerator.generate({
    length: 32,
    numbers: true
  });

  log.info(`Creating database ${dbName}`);

  // Create the new deployment database.
  await ensureDatabase(rootConn, dbName);

  // Connect to the newly created database.
  const deploymentCfg = merge(clone(parsedConn), { database: dbName });
  const deploymentDb = createConnection(deploymentCfg);

  // Create schema for airflow metadata.
  await ensureUserAndSchema(
    deploymentDb,
    airflowSchemaName,
    airflowUserName,
    airflowPassword,
    parsedConn.user,
    allowRootAccess
  );

  // Create schema for celery result backend.
  await ensureUserAndSchema(
    deploymentDb,
    celerySchemaName,
    celeryUserName,
    celeryPassword,
    parsedConn.user,
    allowRootAccess
  );

  // Kill connection to the deployments db.
  deploymentDb.destroy();

  log.info(`Created database ${dbName}`);

  // Construct connection details for airflow schema.
  const metadataConnection = {
    user: airflowUserName,
    pass: airflowPassword,
    host: parsedConn.host,
    port: parsedConn.port,
    db: dbName
  };

  // Construt connection details for celery schema.
  const resultBackendConnection = merge(clone(parsedConn), {
    user: celeryUserName,
    pass: celeryPassword,
    host: parsedConn.host,
    port: parsedConn.port,
    db: dbName
  });

  // Return both urls.
  return { metadataConnection, resultBackendConnection };
}

/*
 * Drop databases from createDatabaseForDeployment.
 * @param {Object} config An object containing configuration
 */
export async function removeDatabaseForDeployment(deployment) {
  const { enabled, connection } = config.get("deployments.database");
  // Exit early if we have database creation disabled.
  if (!enabled) {
    log.info("Deployment database creation disabled, skipping");
    return {};
  }

  // Parse the connection into a standard format.
  const parsedConn = parseConnection(connection);

  // Create connection as root user.
  const rootConn = createConnection(parsedConn);

  const dbName = generateDatabaseName(deployment.releaseName);
  log.info(`Dropping database ${dbName}`);

  // In case of database doesn't exists
  try {
    await rootConn.raw(`REVOKE CONNECT ON DATABASE ${dbName} FROM public;`);
    await rootConn.raw(
      `SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '${dbName}';`
    );
    await rootConn.raw(`DROP DATABASE ${dbName};`);
    log.info(`Dropped database ${dbName}`);
  } catch (e) {
    log.error(e);
  } finally {
    // To prevent hanging, we should explicitly destroy connection
    await rootConn.destroy();
  }
}

/*
 * Create a new database connection.
 * @param {Object} config An object containing configuration
 * information for the database.
 */
export function createConnection(config) {
  return knex({ client: "postgres", connection: config });
}

/*
 * Create a new database for a deployment.
 * @param {Object} conn An existing database connection.
 * @param {String} name Name for the new database.
 */
export async function ensureDatabase(conn, name) {
  const results = await conn.raw(
    `SELECT EXISTS(SELECT datname FROM pg_catalog.pg_database WHERE datname = '${name}')`
  );
  const exists = first(results.rows).exists;
  if (!exists) {
    await conn.raw(`CREATE DATABASE ${name}`);
  }
}

/*
 * Create a new user in the database if it does not already exist.
 * @param {Object} conn An existing database connection.
 * @param {String} name Name for the new user.
 * @param {String} password The users new password.
 */
export async function ensureUser(conn, user, password) {
  // Check if user exists
  const result = await conn.raw(
    `SELECT EXISTS(SELECT usename FROM pg_user WHERE usename = '${user}')`
  );
  const exists = first(result.rows).exists;
  if (!exists) {
    await conn.raw(
      `CREATE USER ${user} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION CONNECTION LIMIT -1 ENCRYPTED PASSWORD '${password}';`
    );
  }
}

/*
 * Create a new schema if it does not already exist.
 * @param {Object} conn An existing database connection.
 * @param {String} schema The name of the desired schema.
 * @param {String} user The user authorized to this schema.
 */
export async function ensureSchema(conn, schema, user) {
  // Check if schema exists
  // Create a new schema, granting the new user access.
  await conn.raw(`CREATE SCHEMA IF NOT EXISTS ${schema} AUTHORIZATION ${user}`);
}

/*
 * Create a schema with new user/role, if they do not exist.
 * @param {Object} conn An existing database connection.
 * @param {String} schema Name of the schema to create.
 * @param {String} user The name of the user for this schema.
 * @param {String} password The password for the new user.
 * @param {String} creator The root user.
 */
export async function ensureUserAndSchema(
  conn,
  schema,
  user,
  password,
  creator,
  allowRootAccess
) {
  // Create the database user.
  await ensureUser(conn, user, password);

  // Grant the privleges of the new user to our root user (the one running these commands).
  await conn.raw(`GRANT ${user} TO ${creator}`);

  // Ensure the schmea is created.
  await ensureSchema(conn, schema, user);

  // Assign privleges to the new user.
  await conn.raw(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT ALL PRIVILEGES ON TABLES TO ${user};` +
      `ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT USAGE ON SEQUENCES TO ${user};` +
      `GRANT USAGE ON SCHEMA ${schema} TO ${user};` +
      `GRANT CREATE ON SCHEMA ${schema} TO ${user};` +
      `GRANT ALL PRIVILEGES ON SCHEMA ${schema} TO ${user};` +
      `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ${schema} TO ${user};` +
      `GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA ${schema} TO ${user};`
  );

  // Set the search path of the new user to include the new schema.
  await conn.raw(`ALTER ROLE ${user} SET search_path = ${schema};`);

  // Revoke the root users access from the new schema.
  if (!allowRootAccess) {
    await conn.raw(`REVOKE ${user} FROM ${creator}`);
  }

  log.info(`Created ${schema} schema for ${user}`);
}

/*
 * Parse the connection configuration into an object.
 * @param {String} conn A postgres connection string or connection object.
 * @param {Object} The parsed connection object.
 */
export function parseConnection(conn) {
  if (isString(conn)) return parse(conn);
  return conn;
}
