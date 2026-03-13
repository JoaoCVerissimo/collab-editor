import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('document_versions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('document_id').notNullable().references('id').inTable('documents').onDelete('CASCADE');
    table.binary('yjs_snapshot').notNullable();
    table.text('content_text');
    table.integer('version_num').notNullable();
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.string('label', 255);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['document_id', 'version_num'], 'idx_versions_document');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('document_versions');
}
