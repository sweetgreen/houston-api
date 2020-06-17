import { VALID_DOCKER_IMAGE_NAME } from "constants";
/*
 * List of potential actions reported by the docker registry.
 */
export const ACTIONS = {
  PUSH: "push",
  PULL: "pull",
  MOUNT: "mount",
  DELETE: "delete"
};

/*
 * Handle webhooks from the docker registry.
 * @param {Object} ev The docker event.
 * @return {Boolean} If the tag is valid to push out to a deployment.
 */
export default function isValidTaggedDeployment(ev) {
  return (
    ev.action === ACTIONS.PUSH &&
    ev.target.tag.length > 0 &&
    ev.target.tag !== "latest" &&
    // Reserved repository in docker registry for base airflow images
    ev.target.repository !== "base-images/airflow" &&
    VALID_DOCKER_IMAGE_NAME.test(ev.target.repository)
  );
}
