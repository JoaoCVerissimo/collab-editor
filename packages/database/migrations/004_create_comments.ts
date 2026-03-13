import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('comments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('document_id').notNullable().references('id').inTable('documents').onDelete('CASCADE');
    table.uuid('author_id').notNullable().references('id').inTable('users');
    table.jsonb('anchor');
    table.text('content').notNullable();
    table.uuid('parent_id').references('id').inTable('comments').onDelete('CASCADE');
    table.boolean('resolved').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('document_id', 'idx_comments_document');
    table.index('parent_id', 'idx_comments_parent');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('comments');
}
