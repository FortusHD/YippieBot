// Imports
const datetime = require('date-and-time');
const logger = require('../logging/logger');
const { getGuildId, getWichtelChannelId } = require('../util/config');
const { buildWichtelEmbed } = require('../util/embedBuilder');
const { getParticipants } = require('../database/tables/wichtelParticipants');
const { insertOrUpdateId, getId } = require('../database/tables/messageIDs');
const { setWichtelData, getWichtelData } = require('../database/tables/dataStore');

const datePattern = '[0-3][0-9].[0-1][0-9].[0-9][0-9][0-9][0-9], [0-2][0-9]:[0-5][0-9]';
let localClient = null;
let wichtelLoopId = null;

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

    logger.debug(`Matches: ${matches.map(match => `${match[0].dcName} - ${match[1].dcName}`).join(', ')}`,
        __filename);

    return matches;
}

/**
 * Sends a final message in the specified channel about the state of the gift exchange event.
 * If no participants joined, it informs about the cancellation.
 * Otherwise, it provides details about the event date and the list of participants.
 *
 * @param {Object} wichtelChannel - The channel where the message will be sent.
 * @param {Array<Object>} participants - An array of participant objects, each containing `id` and `steamFriendCode`.
 * @param {string} wichtelDate - The date of the gift exchange event in string format.
 * @return {Promise<void>} A promise that resolves when the message is successfully sent.
 */
async function sendEndWichtelMessage(wichtelChannel, participants, wichtelDate) {
    let message = 'Leider haben nicht genug Personen am Schrottwichteln teilgenommen.';

    if (participants.length !== 0) {
        message = `Die Anmeldephase für das Schrottwichteln ist vorbei. Wir treffen uns am **${wichtelDate}**.\n\n`
            + '__Diese Dinge solltest du nochmal überprüfen:__\n'
            + '- Bist du mit deinem\\*r Partner\\*in auf Steam befreundet?\n'
            + '- Ist deine **Spielbibliothek** auf `Öffentlich` oder auf `Für Freunde`?\n'
            + '- Lege dein Geschenk vielleicht schon etwas früher fest, damit dein\\*e Partner\\*in genug Zeit hat '
            + 'das Spiel herunterzuladen (vor allem bei großen Spielen)\n\nTeilnehmer*innen:\n';
        for (const participant of participants) {
            message += `<@${participant.id}>, \`Friend-Code: ${participant.steamFriendCode}\`\n`;
        }
        message = message.trimEnd();
    }

    await wichtelChannel.send(message);
}

/**
 * Ends the Wichteln event by setting the event status to false,
 * clearing the interval, deleting the Wichteln message, matching participants,
 * and notifying them about their partners.
 *
 * @return {Promise<string>} A message indicating the result of ending the Wichteln event.
 */
async function endWichteln() {
    clearInterval(wichtelLoopId);

    const wichtelChannel = localClient.guilds.cache.get(getGuildId())
        .channels.cache.get(getWichtelChannelId());

    const wichtelData = await getWichtelData();
    const participants = await getParticipants();

    if (wichtelChannel !== undefined) {
        if (wichtelData !== null && wichtelData.time !== null) {
            logger.info(`Ending Wichteln at ${new Date().toLocaleString()}`);

            // Delete the message
            const currentMessageID = await getId('wichtelId');

            wichtelChannel.messages.fetch().then(async messages => {
                if (messages.size !== 0 && messages.get(currentMessageID)) {
                    messages.get(currentMessageID).delete().then(() => {
                        logger.info('Deleted Wichtel message.');
                    });
                }

                await sendEndWichtelMessage(wichtelChannel, participants, wichtelData.time);

                await insertOrUpdateId('wichtelId', '');
            });

            if (participants.length > 1) {
                // Match participants
                let matches = null;

                while (matches === null) {
                    matches = matchParticipants(participants);
                }

                // Send messages with partners
                for (let i = 0; i < matches.length; i++) {
                    const match = matches[i];
                    localClient.users.fetch(match[0].id).then(async user => {
                        const matchEmbed = buildWichtelEmbed(match[1], wichtelData.time);

                        logger.info(`Sending ${match[0].dcName} their partner ${match[1].dcName}.`);

                        await user.send({ embeds: [matchEmbed] });
                    });
                }
            } else {
                logger.info('Not enough participants for wichteln');
            }

            await setWichtelData({ wichteln: false, end: '', time: '' });
            return ('Das Wichteln wurde beendet!');
        } else {
            logger.warn('Could not find wichtel_time');
            return ('Die wichtel_time konnte nicht gefunden werden!');
        }
    } else {
        logger.warn(`The wichtel-channel with id ${getWichtelChannelId()} could not be found.`);
        return ('Der Wichtel-Channel konnte nicht gefunden werden!');
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
    getWichtelData().then(wichtelData => {
        const endStr = wichtelData?.end;

        if (endStr && endStr.match(datePattern)) {
            const end = datetime.parse(endStr, 'DD.MM.YYYY, HH:mm:ss', false);
            const now = new Date();

            if (now > end) {
                logger.info('Ending "wichtelLoop"');
                endWichteln().then(() => {
                    logger.info('"wichtelLoop" ended automatically');
                });
            }
        } else {
            setWichtelData({ wichteln: false, end: '', time: '' }).then(() => {
                logger.warn('No end date found in wichtel_end.json, "wichtelLoop" stopped.');
                clearInterval(wichtelLoopId);
            });
        }
    });
}

/**
 * Starts the Wichtel loop if the `wichteln` flag is true.
 *
 * @return {Promise<void>} A promise that resolves when the Wichtel loop has been potentially started.
 */
async function startWichtelLoop(client) {
    const wichtelData = await getWichtelData();
    localClient = client;
    if (wichtelData?.wichteln === true) {
        logger.info('Starting "wichtelLoop"');
        wichtelLoopId = setInterval(wichtelLoop, 1000);
    }
}

module.exports = { startWichtelLoop, endWichteln };