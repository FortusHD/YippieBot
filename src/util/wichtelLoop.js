// Imports
const datetime = require('date-and-time');
const logger = require('../logging/logger');
const config = require('config');
const { EmbedBuilder } = require('discord.js');
const { getWichteln, getWichtelEnd, getWichtelTime, getMessageID, updateMessageID, getParticipants, resetWichtelData } = require('./json_manager');

const datePattern = '[0-3][0-9].[0-1][0-9].[0-9][0-9][0-9][0-9], [0-2][0-9]:[0-5][0-9]';
let wichtelLoopId = null;
let localClient = null;

/**
 * Starts the Wichtel loop if the `wichteln` flag is true.
 *
 * @param {Object} client - The client object used to interact with the Wichtel system.
 * @return {Promise<void>} A promise that resolves when the Wichtel loop has been potentially started.
 */
async function startWichtelLoop(client) {
	localClient = client;
	const wichteln = getWichteln();
	if (wichteln === true) {
		logger.info('Starting "wichtelLoop"');
		wichtelLoopId = setInterval(wichtelLoop, 1000);
	}
}

/**
 * Function to manage the automatic ending of the "wichtel" process based on a specified end date.
 * It retrieves the end date from a remote source, compares it with the current date, and decides
 * whether to end the "wichtel" process or not. If no valid end date is found, it stops the loop.
 *
 * @return {void}
 */
function wichtelLoop() {
	const endStr = getWichtelEnd();

	if (endStr && endStr.match(datePattern)) {
		const end = datetime.parse(endStr, 'DD.MM.YYYY, HH:mm:ss');
		const now = new Date();

		if (now > end) {
			logger.info('Ending "wichtelLoop"');
			endWichteln(localClient).then(() => {
				logger.info('"wichtelLoop" ended automatically');
			});
		}
	} else {
		resetWichtelData();
		logger.warn('No end date found in wichtel_end.json, "wichtelLoop" stopped.');
		clearInterval(wichtelLoopId);
	}
}

/**
 * Matches participants into pairs, ensuring no participant is repeated.
 *
 * @param {Array} participants - An array of participants to be matched.
 * @return {Array|null} An array of matched pairs or null if pairing is not possible.
 */
function matchParticipants(participants) {
	const matches = [];
	const matched = [];

	for (let i = 0; i < participants.length; i++) {
		const current = participants[i];
		const availablePartners = participants.filter(participant => participant !== current
			&& !matched.includes(participant));
		if (availablePartners.length === 0) {
			return null;
		}
		const randomIndex = Math.floor(Math.random() * availablePartners.length);
		const randomPartner = availablePartners[randomIndex];
		matches.push([current, randomPartner]);
		matched.push(randomPartner);
	}

	return matches;
}

/**
 * Ends the Wichteln event by setting the event status to false,
 * clearing the interval, deleting the Wichteln message, matching participants,
 * and notifying them about their partners.
 *
 * @param {Object} client - The Discord client instance used for fetching guilds and users.
 * @return {Promise<string>} A message indicating the result of ending the Wichteln event.
 */
async function endWichteln(client) {
	resetWichtelData();
	clearInterval(wichtelLoopId);

	const wichtelChannel = client.guilds.cache.get(config.get('GUILD_ID'))
		.channels.cache.get(config.get('WICHTEL_CHANNEL_ID'));

	const wichtelTime = getWichtelTime();

	if (wichtelChannel !== undefined) {
		if (wichtelTime !== null) {
			logger.info(`Ending Wichteln at ${new Date().toString()}`);

			// Delete message
			const currentMessageID = getMessageID('wichtel_id');

			wichtelChannel.messages.fetch().then(async messages => {
				if (messages.size !== 0 && messages.get(currentMessageID)) {
					messages.get(currentMessageID).delete().then(() => {
						logger.info('Deleted Wichtel message.');
					});
				}

				updateMessageID('wichtel_id', '');
			});

			const participants = getParticipants();

			if (participants.length > 1) {
				// Match participants
				let matches = null;

				while (matches == null) {
					matches = matchParticipants(participants);
				}

				// Send messages with partners
				for (let i = 0; i < matches.length; i++) {
					const match = matches[i];
					client.users.fetch(match[0].id).then(user => {
						const matchEmbed = new EmbedBuilder()
							.setColor(0xDB27B7)
							.setTitle('Wichtel-Post')
							.setDescription(`Hallo,\ndein Wichtel-Partner ist <@${match[1].id}>\nDiscord: ${match[1].dcName}\nSteam: ${match[1].steamName}\nSteam Friend-Code: ${match[1].steamFriendCode}\n\nÜberlege dir ein schönes Spiel für deinen Partner und kaufe es auf Steam und lege es als Geschenk für den **${wichtelTime}** oder früher fest.\nFalls du nicht weißt wie das geht, ist Google dein bester Freund, oder frag einfach jemanden.`);

						logger.info(`Sending ${match[0].dcName} their partner ${match[1].dcName}.`);

						user.send({ embeds: [matchEmbed] });
					});
				}
			} else {
				logger.info('Not enough participants for wichteln');
			}

			resetWichtelData();
			return('Das Wichteln wurde beendet!');
		} else {
			logger.warn('Could not find wichtel_time');
			return('Die wichtel_time konnte nicht gefunden werden!');
		}
	} else {
		logger.warn(`The wichtel-channel with id ${config.get('WICHTEL_CHANNEL_ID')} could not be found.`);
		return('Der Wichtel-Channel konnte nicht gefunden werden!');
	}
}

module.exports = { startWichtelLoop, endWichteln };