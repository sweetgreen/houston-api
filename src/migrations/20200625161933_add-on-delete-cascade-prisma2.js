import log from "logger";

export async function up(knex) {
  await knex.transaction(async function(trx) {
    log.debug(
      'Recreate  constraint for RoleBinding_workspaceId_fkey in  "houston$default"."RoleBinding" table'
    );
    await trx.raw(
      'ALTER TABLE ONLY "houston$default"."RoleBinding" ' +
        'DROP CONSTRAINT "RoleBinding_workspaceId_fkey"' +
        ', ADD CONSTRAINT "RoleBinding_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "houston$default"."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;'
    );

    log.debug(
      'Recreate  constraint for RoleBinding_deploymentId_fkey in  "houston$default"."RoleBinding" table'
    );
    await trx.raw(
      'ALTER TABLE ONLY "houston$default"."RoleBinding" ' +
        'DROP CONSTRAINT "RoleBinding_deploymentId_fkey"' +
        ', ADD CONSTRAINT "RoleBinding_deploymentId_fkey" FOREIGN KEY ("deploymentId")REFERENCES "houston$default"."Deployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;'
    );

    log.debug(
      'Recreate  constraint for RoleBinding_serviceAccountId_fkey in  "houston$default"."RoleBinding" table'
    );
    await trx.raw(
      'ALTER TABLE ONLY "houston$default"."RoleBinding" ' +
        'DROP CONSTRAINT "RoleBinding_serviceAccountId_fkey"' +
        ', ADD CONSTRAINT "RoleBinding_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId")REFERENCES "houston$default"."ServiceAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;'
    );

    log.debug(
      'Recreate  constraint for RoleBinding_userId_fkey in  "houston$default"."RoleBinding" table'
    );
    await trx.raw(
      'ALTER TABLE ONLY "houston$default"."RoleBinding" ' +
        'DROP CONSTRAINT "RoleBinding_userId_fkey"' +
        ', ADD CONSTRAINT "RoleBinding_userId_fkey" FOREIGN KEY ("userId")REFERENCES "houston$default"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;'
    );

    log.debug(
      'Recreate  constraint for Email_userId_fkey in  "houston$default"."Email" table'
    );
    await trx.raw(
      'ALTER TABLE ONLY "houston$default"."Email" ' +
        'DROP CONSTRAINT "Email_userId_fkey"' +
        ', ADD CONSTRAINT "Email_userId_fkey" FOREIGN KEY ("userId")REFERENCES "houston$default"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;'
    );

    log.debug(
      'Recreate  constraint for LocalCredential_userId_fkey in  "houston$default"."LocalCredential" table'
    );
    await trx.raw(
      'ALTER TABLE ONLY "houston$default"."LocalCredential" ' +
        'DROP CONSTRAINT "LocalCredential_userId_fkey"' +
        ', ADD CONSTRAINT "LocalCredential_userId_fkey" FOREIGN KEY ("userId")REFERENCES "houston$default"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;'
    );

    log.debug(
      'Recreate  constraint for OAuthCredential_userId_fkey in  "houston$default"."OAuthCredential" table'
    );
    await trx.raw(
      'ALTER TABLE ONLY "houston$default"."OAuthCredential" ' +
        'DROP CONSTRAINT "OAuthCredential_userId_fkey"' +
        ', ADD CONSTRAINT "OAuthCredential_userId_fkey" FOREIGN KEY ("userId")REFERENCES "houston$default"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;'
    );
  });
}

export async function down() {}
