import log from "logger";

export async function up(knex) {
  await knex.transaction(async function(trx) {
    log.debug(
      'Recreate  constraint for RoleBinding_workspaceId_fkey in  "houston$default"."RoleBinding" table'
    );

    await trx.raw(
      'ALTER TABLE ONLY "houston$default"."RoleBinding"\n' +
        '  DROP CONSTRAINT "RoleBinding_workspaceId_fkey"\n' +
        ', ADD CONSTRAINT "RoleBinding_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "houston$default"."Workspace"(id) ON UPDATE CASCADE ON DELETE CASCADE;\n'
    );
  });
}

export async function down() {}
