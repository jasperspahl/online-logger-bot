const { Client, Presence, Intents } = require('discord.js');

require('dotenv').config();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_PRESENCES] });

client.on('ready', () => {
	console.log(`Logged in as "${client.user.tag}"`);
});

/**
 * @param {?Presence} oldPresence
 * @param {Presence} newPresence
 */
client.on('presenceUpdate', (oldPresence, newPresence) => {
	console.log(
		`PresenceUpdate Handler:
		Member: ${oldPresence.member.displayName}
		New State: ${newPresence.status}`,
	);

});

client.login(process.env.DISCORD_TOKEN);
