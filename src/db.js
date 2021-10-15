const knex = require('knex');
const knexConfig = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';

const connectionConfig = knexConfig[environment];

const connection = knex(connectionConfig);
connection.on('query', (query) => {
    console.log('[Knex]', query.sql);
    console.log('      ', query.bindings);
});

module.exports = connection;