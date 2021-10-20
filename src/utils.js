// eslint-disable-next-line no-unused-vars
const { User } = require('discord.js');
const db = require('./db');
const tablenames = require('./constants/tablenames');
/**
 * @param {User} user
 * @returns {Promise<string>}
 */
const insertUser = async (user) => {
	return await db(tablenames.user).insert({
		discord_id: user.id,
		username: user.username,
	}).returning('id');
};
module.exports = {
	insertUser,
};
