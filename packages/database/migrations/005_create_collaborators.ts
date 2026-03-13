import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('collaborators', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('document_id').notNullable().references('id').inTable('documents').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('permission', 20).notNullable().defaultTo('edit');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['document_id', 'user_id']);
    table.index('document_id', 'idx_collaborators_document');
    table.index('user_id', 'idx_collaborators_user');
  });

  // Add check constraint for permission values
  await knex.raw(`
    ALTER TABLE collaborators
    ADD CONSTRAINT chk_permission
    CHECK (permission IN ('view', 'comment', 'edit', 'admin'))
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('collaborators');
}
