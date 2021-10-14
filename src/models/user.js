const db = require('../db');

/**
 * @typedef {Object} User
 * @param {number} id
 * @param {string} discord_id
 * @param {string} username
 */
const User = () => db('user');

module.exports = User;