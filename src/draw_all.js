/* eslint-disable no-case-declarations */
// eslint-disable-next-line no-unused-vars
const { Message, MessageAttachment } = require('discord.js');
const Canvas = require('canvas');
const tablenames = require('./constants/tablenames');
const db = require('./db');
const { hourwidth, sectionHeight } = require('./constants/config');
const color = require('./constants/colors');

/**
 * @typedef {Object} Entry
 * @property {number} state_id
 * @property {Date} created_at
 */
/**
 * @typedef {Object} User
 * @property {Entry[]} entrys
 * @property {string} username
 */

/**
 * Draw All Entrys in to the database
 * @param {Message} msg
 */
const draw_all = async (msg) => {
    msg.channel.sendTyping();
    const data = await getData(msg);
    if (data.length == 0) {
        msg.reply('No Data found!');
        return;
    }

    const now = new Date();
    const width = hourwidth * 24;
    const height = data.length * sectionHeight;

    Canvas.registerFont('./assets/FiraCode-Regular.ttf', { family: 'FiraCode' });

    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = color.bg;
    ctx.fillRect(0, 0, width, height);
    ctx.font = '20px FiraCode';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';

    const oneday = 24 * 60 * 60 * 1000;
    data.forEach((user, index) => {
        const y = index * sectionHeight;
        let latest = now;
        user.entrys.forEach(entry => {
            switch (entry.state_id) {
                case 1:
                case 2:
                case 4:
                    const currentPos = getPosFromTime(entry.created_at);
                    const latestPos = getPosFromTime(latest);
                    ctx.fillStyle = `${color.getStatusColor(entry.state_id)}44`;
                    if (latest - latest % oneday > entry.created_at) {
                        ctx.fillRect(0, y, latestPos, sectionHeight);
                        ctx.fillRect(currentPos, y, width - currentPos, sectionHeight);

                    }
                    else {
                        ctx.fillRect(currentPos, y, latestPos - currentPos, sectionHeight);
                    }
                    latest = entry.created_at;
                    break;
                default:
                    latest = entry.created_at;
                    break;
            }
        });
    });

    const attachment = new MessageAttachment(canvas.toBuffer(), 'image.png');

    msg.channel.send({ files: [attachment] });

};

const divval = 3600000 / hourwidth;
/**
 * @param {Date|number} time
 * @returns {number}
 */
const getPosFromTime = (time) => {
    // console.log('Time:', new Date(time));
    const pos = Math.round(time % 86400000 / divval);
    // console.log('Pos', pos);
    return pos;
};

/**
 * @param {Message} msg
 * @returns {User[]}
 */
const getData = async () => {
    /**
     * @typedef {Object} RawRow
     * @property {string} username
     * @property {number} id
     * @property {string} created_at
     */

    /**
     * @typedef {RawRow[]} RawDara
     */

    /**
     * @type {RawDara}
     */
    const data = await db(tablenames.entry)
        .join(tablenames.state, `${tablenames.entry}.state_id`, `${tablenames.state}.id`)
        .join(tablenames.user, `${tablenames.entry}.user_id`, `${tablenames.user}.id`)
        .select('user.username', 'state.id', 'entry.created_at')
        .orderBy(['user.username', { column: 'entry.created_at', order: 'desc' }]);
    if (!data[0]) {
        return [];
    }


    const res = [];
    let user = data[0].username;
    let user_data = [];
    for (const i in data) {
        if (data[i].username !== user) {
            res.push({
                username: user,
                entrys: user_data,
            });
            user = data[i].username;
            user_data = [];
        }
        user_data.push({
            state_id: data[i].id,
            created_at: new Date(data[i].created_at),
        });
    }
    res.push({
        username: user,
        entrys: user_data,
    });
    return res;

};
module.exports = draw_all;
