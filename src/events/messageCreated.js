// Imports
const { Events } = require('discord.js');
const logger = require('../logging/logger.js');
const path = require('node:path');

// Triggered when user sends message -> Will answer if message contains word similar to hunt
module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		const regex = new RegExp('hunt|hand|hund', 'i');
		const answers = ['Hat da jemand Hunt gesagt?', 'Was? HUNT?', 'Hunt?', 'Wer will Hunt spielen?'];

		if (message && !message.author.bot && message.content && regex.test(message.content)) {
			logger.info(`Message from ${message.author.username} matches ${regex}, 
			so "hunt"-answer will be sent`);
			if (Math.random() < 0.3) {
				const img_path = path.join(__dirname, `../img/hunt${Math.floor(Math.random() * 3) + 1}.jpg`);
				await message.channel.send({
					files: [{
						attachment: img_path,
						name: 'hunt.jpg'
					}]});
			} else {
				await message.channel.send(answers[Math.floor(Math.random() * answers.length)]);
			}
		}
	},
};