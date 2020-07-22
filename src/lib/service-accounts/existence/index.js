import { prisma } from "generated/client";
import { DuplicateServiceAccountLabelError } from "errors";
import { find } from "lodash";

/*
 * Check if this label exists for this service account.
 * Houston 1 relied on a multi-column unique index, which prisma does not currently support.
 * This is the workaround for now. Issues for this are opened here:
 * https://github.com/prisma/prisma/issues/171
 * https://github.com/prisma/prisma/issues/1300
 */
export default async function validateExistence({
  label,
  workspaceUuid,
  deploymentUuid
}) {
  // Workspace Scope
  if (workspaceUuid) {
    // Query for serviceAccounts using label
    const serviceAccounts = await prisma
      .serviceAccounts({ where: { label } })
      .roleBinding()
      .workspace();

    // If we didn't find any service accounts, return early.
    if (!serviceAccounts) return;

    // Check if this name exists in this workspace.
    const serviceAccount = find(
      serviceAccounts,
      sA =>
        sA.roleBinding.workspace &&
        sA.roleBinding.workspace.id === workspaceUuid
    );

    // If we didn't find a service account, return.
    if (!serviceAccount) return;

    // Otherwise throw the error
    throw new DuplicateServiceAccountLabelError(label);
  }

  // Deployment Scope
  if (deploymentUuid) {
    // Query for serviceAccounts using label
    const serviceAccounts = await prisma
      .serviceAccounts({ where: { label } })
      .roleBinding()
      .deployment();

    // If we didn't find any service accounts, return early.
    if (!serviceAccounts) return;

    // Check if this name exists in this workspace.
    const serviceAccount = find(
      serviceAccounts,
      sA =>
        sA.roleBinding.deployment &&
        sA.roleBinding.deployment.id === deploymentUuid
    );

    // If we didn't find a service account, return.
    if (!serviceAccount) return;

    // Otherwise throw the error
    throw new DuplicateServiceAccountLabelError(label);
  }
}
