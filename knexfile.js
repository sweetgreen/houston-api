import "dotenv/config";
import config from "config";

// Grab database configuration.
const { connection, migrations } = config.get("database");

const sslConn = `${connection}?ssl=true`;

// Export the knex configuration.
// This needs to be old school export for knex.
module.exports = {
  client: "postgres",
  sslConn,
  migrations: {
    directory: __dirname + "/src/migrations",
    tableName: migrations.tableName,
    schemaName: migrations.schemaName,
    disableTransactions: migrations.disableTransactions
  }
};
