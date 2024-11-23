// Imports
const logger = require('../logging/logger');
const { checkPollsEnd } = require('./json_manager');
const { EmbedBuilder } = require('discord.js');

let localClient = null;

/**
 * Starts the polling loop for the provided client. This method initializes the local client instance
 * to the provided client and begins the polling process which occurs every second.
 *
 * @param {Object} client - The client instance used in the poll loop.
 * @return {void}
 */
async function startPollLoop(client) {
	localClient = client;

	logger.info('Starting "pollLoop"');
	setInterval(pollLoop, 1000);
}

/**
 * The `pollLoop` function checks for ended polls, fetches the associated messages from a Discord channel,
 * calculates the results, and sends the results as a new message embed. This function is designed to
 * be run asynchronously.
 *
 * @return {Promise<void>} A promise that resolves when the poll results have been fetched and the result
 *                         messages have been sent.
 */
async function pollLoop() {
	checkPollsEnd().then(removedPolls => {
		removedPolls.forEach(poll => {
			localClient.channels.fetch(poll.channelId).then(async channel => {
				const pollMessage = await channel.messages.fetch(poll.messageId);

				const question = pollMessage.embeds[0].description;
				const answers_raw = pollMessage.embeds[0].fields[0].value.split('\n');

				const answers = [];
				const answersString = [];

				for (let i = 0; i < answers_raw.length; i++) {
					answers.push({
						emoji: answers_raw[i].split(' ')[0],
						text: answers_raw[i].split(' ').slice(1).join(' '),
						count: pollMessage.reactions.resolve(answers_raw[i].split(' ')[0]).count - 1
					});
				}

				answers.sort((a, b) => b.count - a.count).forEach(answer => {
					answersString.push(`${answer.emoji} ${answer.text} - ${answer.count}`);
				});

				const resultEmbed = new EmbedBuilder()
					.setColor(0x2210e8)
					.setTitle('Umfrage-Ergebnisse')
					.setDescription(question)
					.addFields([
						{name: 'Ergebnis', value: answersString.join('\n'), inline: false}
					]);

				await channel.send({ embeds: [resultEmbed] });
			});
		});
	});
}

module.exports = { startPollLoop };