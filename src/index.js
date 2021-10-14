/* cSpell: disable */
const { Client, Intents, Message, MessageAttachment } = require('discord.js');
const PresenceStatus = require('./constants/PresenceStatus');
const tablenames = require('./constants/tablenames');
const Canvas = require('canvas');
const config = require('./constants/config');
const color = require('./constants/colors');
const db = require('./db');

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
				const id = await db(tablenames.user).insert({
					discord_id: newPresence.user.id,
					username: newPresence.user.username,
				}).returning('id');
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

			default:
				break;
		}
	}
});
/**
 * @param {Message} msg
 */
const drawStatus = async msg => {
	let user_ids = msg.mentions.users.map(user => user.id);
	if (user_ids.length == 0) {
		msg.reply('Please Mention the users you want to see the stats of');
	}
	user_ids = [msg.author.id];
	const data = await db(tablenames.entry)
		.join(tablenames.state, `${tablenames.entry}.state_id`, `${tablenames.state}.id`)
		.join(tablenames.user, `${tablenames.entry}.user_id`, `${tablenames.user}.id`)
		.select('user.username', 'state.id', 'entry.created_at')
		.whereIn('user.discord_id', user_ids)
		.orderBy(['user.username', { column: 'entry.created_at', order: 'desc' }]);

	const now = new Date();

	const hourwidth = 50;
	const width = hourwidth * 12;
	const sectionHeight = 40;
	const height = (user_ids.length) * sectionHeight;


	Canvas.registerFont('./assets/FiraCode-Regular.ttf', { family: 'FiraCode' });
	const canvas = Canvas.createCanvas(width, height);
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = color.bg;
	ctx.fillRect(0, 0, width, height);


	// / 30 pix per hour => 1 pix per 2 min => 60*60*1000 / 30
	const divval = 3600000 / hourwidth;
	let user = data[0].username;
	let nth_user = 0;
	let last = 0;
	ctx.font = '20px FiraCode';
	ctx.textBaseline = 'middle';
	console.log('drawing data for', user);
	for (const i in data) {
		if (data[i].username !== user) {
			ctx.fillStyle = color.fg;
			ctx.fillText(user, 10, nth_user * sectionHeight + sectionHeight / 2);
			nth_user++;
			user = data[i].username;
			last = 0;
			console.log('Drawing data for "', user, '"');
		}
		const offset = now - new Date(data[i].created_at);

		const pix_off = Math.round(offset / divval) - last;
		// console.log('min passed: ', offset / 60000);
		// console.log('pix_off: ', pix_off);
		// console.log(width - pix_off - last);
		ctx.fillStyle = color.getStatusColor(data[i].id);
		// console.log(ctx.fillStyle);
		ctx.fillRect(width - pix_off - last, nth_user * sectionHeight, pix_off, sectionHeight);

		last += pix_off;
	}
	ctx.fillStyle = color.fg;
	ctx.fillText(user, 10, nth_user * sectionHeight + sectionHeight / 2);
	// console.log('users: ', nth_user);

	ctx.strokeStyle = `${color.gray}cc`;
	for (let i = sectionHeight; i < height; i += sectionHeight) {
		ctx.beginPath();
		ctx.moveTo(0, i);
		ctx.lineTo(width, i);
		ctx.stroke();
	}
	// i !== 0 => Ajusting for offset to full hour
	for (let i = width - now % 3600000 / divval; i > 0; i -= hourwidth) {
		ctx.beginPath();
		ctx.moveTo(i, 0);
		ctx.lineTo(i, height);
		ctx.stroke();
	}

	const attachment = new MessageAttachment(canvas.toBuffer(), 'image.png');

	msg.reply({ files: [attachment] });
};

client.login(process.env.DISCORD_TOKEN);
