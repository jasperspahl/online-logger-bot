const { Knex } = require('knex');
const tablenames = require('../src/constants/tablenames');

/**
 *
 * @param {Knex} knex
 */
exports.up = async (knex) => {
    await knex.schema.createTable(tablenames.user, (table) => {
        table.increments().notNullable();
        table.text('discord_id').notNullable().index().unique();
        table.text('username').notNullable();
    });
    await knex.schema.createTable(tablenames.state, table => {
        table.increments().notNullable();
        table.string('name').notNullable();
    });
    await knex.schema.createTable(tablenames.entry, table => {
        table.increments().notNullable();
        table.integer('user_id').notNullable().references('id').inTable(tablenames.user).onDelete('cascade');
        table.integer('state_id').notNullable().references('id').inTable(tablenames.state).onDelete('cascade');
        table.timestamps(false, true);
    });
};

/**
 *
 * @param {Knex} knex
 */
exports.down = async (knex) => {
    await knex.schema.dropTable(tablenames.entry);
    await knex.schema.dropTable(tablenames.user);
    await knex.schema.dropTable(tablenames.state);
};
