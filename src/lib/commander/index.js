import log from "logger";
import protoPath from "commander-proto";
import grpc from "grpc";
import caller from "grpc-caller";
import config from "config";

// Get the commander settings.
const { enabled, host, port } = config.get("commander");

// Concat host and port.
const authority = `${host}:${port}`;

// Path to the Commander service definition.
const path = `${protoPath}/commander.proto`;

// Service name.
const service = "Commander";

// Credentials for Commander.
const credentials = grpc.credentials.createInsecure();

// Export the wrapped grpc client.
const client = caller(authority, path, service, credentials);

/*
 * Make request to commander.
 * @param {String} methodName The commander method.
 * @return {Response} The response.
 */
export async function request(...args) {
  // Method name is first arg as a string.
  const method = `#${args[0]}`;

  // If commander is enabled, run method, otherwise skip and log.
  if (enabled) {
    log.info(`Calling commander method ${method}`);
    const req = new client.Request(...args);
    const res = await req.exec();

    if !(res.response.result.success) {
      throw `Error calling commander: ${res.response.result.message}`;
    }

    const result = method === "#getSecret" ? res.response.result : res.response;
    log.info(`Response from ${method}: ${JSON.stringify(result)}`);

    return res.response;
  }
  log.info(`Commander disabled, skipping call to ${method}`);
}

export default { client, request };
