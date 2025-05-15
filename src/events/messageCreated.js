// Imports
const { Events } = require('discord.js');
const fs = require('node:fs');
const logger = require('../logging/logger.js');
const path = require('node:path');
const { getBobbyChannelId } = require('../util/config');

// Triggered when a user sends a message
module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        const huntRegex = new RegExp('hunt|hand|hund', 'i');
        const answers = ['Hat da jemand Hunt gesagt?', 'Was? HUNT?', 'Hunt?', 'Wer will Hunt spielen?'];

        if (!message) {
            return;
        }

        // Will answer if a message contains word similar to hunt
        if (!message.author.bot && message.content && huntRegex.test(message.content)) {
            logger.info(`Message from "${message.author.username}" matches ${huntRegex}, `
                + 'so "hunt"-answer will be sent');
            if (Math.random() < 0.4) {
                const imgFolderPath = path.join(__dirname, '../../img');
                const imgFolder = fs.readdirSync(imgFolderPath);
                const imgFiles = imgFolder.filter(file => fs.statSync(path.join(imgFolderPath, file)).isFile());
                const randomImgIndex = Math.floor(Math.random() * imgFiles.length);

                await message.channel.send({
                    files: [{
                        attachment: path.join(imgFolderPath, imgFiles[randomImgIndex]),
                        name: 'hunt.jpg',
                    }] });
            } else {
                await message.channel.send(answers[Math.floor(Math.random() * answers.length)]);
            }
        }

        // Will add reactions to info messages regarding Bobby's twitch account
        if (message.author.bot && message.content && message.channel.id === getBobbyChannelId()) {
            if (message.content.toLowerCase().includes('live')) {
                await message.react('🎉');
            } else if (message.content.toLowerCase().includes('offline')) {
                await message.react('😔');
            }
        }
    },
};