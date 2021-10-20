/* cSpell: disable */
const { Client, Intents } = require('discord.js');
const PresenceStatus = require('./constants/PresenceStatus');
const tablenames = require('./constants/tablenames');
const config = require('./constants/config');
const db = require('./db');
const drawStatus = require('./drawStatus');
const draw_all = require('./draw_all');
const draw_all_with_names = require('./draw_all_with_names');
const { insertUser } = require('./utils');

require('dotenv').config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_PRESENCES, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
	console.info(`Logged in as "${client.user.tag}"`);
});

/**
 * @param {?Discord.Presence} oldPresence
 * @param {Discord.Presence} newPresence
 */
client.on('presenceUpdate', async (oldPresence, newPresence) => {
	if (oldPresence ? oldPresence.status !== newPresence.status : true) {
		console.info('Bot received Presence Update');
		console.info(`    ${newPresence.user.username} is now ${newPresence.status}`);
		let user = await db(tablenames.user).where({ discord_id: newPresence.user.id }).select('id').first();
		if (user === undefined) {
			try {
				const id = await insertUser(newPresence.user);
				user = { id };
			}
			catch (err) {
				if (err.code === '23505') {
					user = await db(tablenames.user).where({ discord_id: newPresence.user.id }).select('id').first();
				}
				else {
					console.error(err);
				}
			}
		}
		const status = PresenceStatus[newPresence.status];
		await db(tablenames.entry).insert({ user_id: parseInt(user.id), state_id: status.id });
	}
});

client.on('messageCreate', (message) => {
	if (message.content[0] === config.prefix) {
		const tokens = message.content.slice(1, message.content.length).split(' ');
		switch (tokens[0]) {
			case 'status':
			case 'online':
				drawStatus(message);
				break;
			case 'stat_all':
				if (message.channelId !== '898884002449076294') {
					draw_all(message);
				}
				else{
					draw_all_with_names(message);
				}
				break;

			default:
				break;
		}
	}
});

client.login(process.env.DISCORD_TOKEN);
