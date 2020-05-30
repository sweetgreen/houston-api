import { InvalidDeploymentError } from "errors";
import { includes, filter, forIn, startsWith } from "lodash";
import * as constants from "constants";

// Validate component resources
export default function validateProperties(properties) {
  // Filter down whitelisted deployment properties.
  const allowedProps = filter(constants, (_, name) =>
    startsWith(name, "DEPLOYMENT_PROPERTY")
  );

  // Throw error if we find an invalid property.
  forIn(properties, (_, key) => {
    if (!includes(allowedProps, key)) {
      throw new InvalidDeploymentError(
        `${key} is not a valid deployment property`
      );
    }
  });
}
