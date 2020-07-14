import "dotenv/config";
import config from "config";
import parse from "pg-connection-string";

// Grab database configuration.
const { connection, migrations } = config.get("database");

// Export the knex configuration.
// This needs to be old school export for knex.
module.exports = {
  client: "postgres",
  connection: {
    ssl: true,
    ...parse(connection)
  },
  migrations: {
    directory: __dirname + "/src/migrations",
    tableName: migrations.tableName,
    schemaName: migrations.schemaName,
    disableTransactions: migrations.disableTransactions
  }
};
