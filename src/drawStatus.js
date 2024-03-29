// eslint-disable-next-line no-unused-vars
const { Message, User, MessageAttachment } = require('discord.js');
const Canvas = require('canvas');
const color = require('./constants/colors');
const { insertUser } = require('./utils');
const tablenames = require('./constants/tablenames');
const db = require('./db');
const { hourwidth, sectionHeight } = require('./constants/config');

/**
 * @param {Message} msg
 */
const drawStatus = async msg => {
	msg.channel.sendTyping();
	if (msg.channelId !== '898884002449076294'){
		msg.reply("This command got removed because af privacy concernce");
		return;
	}
	try {
		await insertUser(msg.author);
	}
	catch (err) {
		if (err.code !== '23505') {
			console.error(err);
		}
	}
	const { user_ids, data } = await getData(msg);

	const now = new Date();

	const width = hourwidth * 24;
	const height = (user_ids.length + 1) * sectionHeight;


	Canvas.registerFont('./assets/FiraCode-Regular.ttf', { family: 'FiraCode' });

	const canvas = Canvas.createCanvas(width, height);
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = color.bg;
	ctx.fillRect(0, 0, width, height);


	// / 30 pix per hour => 1 pix per 2 min => 60*60*1000 / 30
	const divval = 3600000 / hourwidth;
	if (!data[0]) {
		msg.reply('No Data for this User');
		// console.log('No Data in data: ', data);
		return;
	}
	let user = data[0].username;
	let nth_user = 1;
	let last = 0;
	ctx.font = '20px FiraCode';
	ctx.textBaseline = 'middle';
	ctx.textAlign = 'left';
	// console.log('Drawing data for "', user, '"');
	for (const i in data) {
		if (data[i].username !== user) {
			ctx.fillStyle = color.fg;
			ctx.fillText(user, 10, nth_user * sectionHeight + sectionHeight / 2);
			nth_user++;
			user = data[i].username;
			last = 0;
			// console.log('Drawing data for "', user, '"');
		}
		const offset = now - new Date(data[i].created_at);

		const pix_off = Math.round(offset / divval) - last;
		ctx.fillStyle = color.getStatusColor(data[i].id);
		ctx.fillRect(width - pix_off - last, nth_user * sectionHeight, pix_off, sectionHeight);

		last += pix_off;
	}
	ctx.fillStyle = color.fg;
	ctx.fillText(user, 10, nth_user * sectionHeight + sectionHeight / 2);

	ctx.strokeStyle = `${color.gray}cc`;
	for (let i = sectionHeight; i < height; i += sectionHeight) {
		ctx.beginPath();
		ctx.moveTo(0, i);
		ctx.lineTo(width, i);
		ctx.stroke();
	}
	// i !== 0 => Ajusting for offset to full hour
	let hour = now.getHours();
	ctx.fillStyle = color.fg;
	ctx.textAlign = 'center';
	for (let i = width - now % 3600000 / divval; i > 0; i -= hourwidth) {
		ctx.beginPath();
		ctx.moveTo(i, sectionHeight);
		ctx.lineTo(i, height);
		ctx.stroke();
		ctx.fillText(`${hour}`, i, sectionHeight / 2);
		hour--;
		if (hour < 0) {
			hour = 23;
		}
	}

	const attachment = new MessageAttachment(canvas.toBuffer(), 'image.png');

	msg.reply({ files: [attachment] });
};

/**
 * @param {Message} msg
*/
const getData = async (msg) => {
	let user_ids = msg.mentions.users.map(user => user.id);
	msg.mentions.roles.forEach(role => {
		// console.log(role.name);
		role.members.forEach(member => {
			user_ids.push(member.id);
		});
	});
	if (user_ids.length == 0) {
		if (!msg.mentions.everyone) {
			msg.reply('Please Mention the users you want to see the stats of');
		}
		user_ids = [msg.author.id];
	}
	if (msg.mentions.everyone) {
		const data = await db(tablenames.entry)
			.join(tablenames.state, `${tablenames.entry}.state_id`, `${tablenames.state}.id`)
			.join(tablenames.user, `${tablenames.entry}.user_id`, `${tablenames.user}.id`)
			.select('user.username', 'state.id', 'entry.created_at')
			.whereRaw(`${tablenames.entry}.created_at >= NOW() - INTERVAL '48 HOURS'`)
			.orderBy(['user.username', { column: 'entry.created_at', order: 'desc' }]);
		user_ids = await db(tablenames.user).select('id');
		// console.log(user_ids);
		return {
			user_ids,
			data,
		};
	}
	else {
		const data = await db(tablenames.entry)
			.join(tablenames.state, `${tablenames.entry}.state_id`, `${tablenames.state}.id`)
			.join(tablenames.user, `${tablenames.entry}.user_id`, `${tablenames.user}.id`)
			.select('user.username', 'state.id', 'entry.created_at')
			.whereIn('user.discord_id', user_ids)
			.andWhere((builder) => {
				builder.whereRaw(`${tablenames.entry}.created_at >= NOW() - INTERVAL '48 HOURS'`);
			})
			.orderBy(['user.username', { column: 'entry.created_at', order: 'desc' }]);
		return {
			user_ids,
			data,
		};
	}
};


module.exports = drawStatus;
