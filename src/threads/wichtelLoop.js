// Imports
const datetime = require('date-and-time');
const logger = require('../logging/logger');
const { getGuildId, getWichtelChannelId } = require('../util/config');
const { buildWichtelEmbed } = require('../util/embedBuilder');
const { getParticipants } = require('../database/tables/wichtelParticipants');
const { insertOrUpdateId, getId } = require('../database/tables/messageIDs');
const { setWichtelData, getWichtelData, setWichtelMatches } = require('../database/tables/dataStore');
const { sanitizeCodeSpan, splitMessage } = require('../util/message');

// The end of the wichteln is checked every 30 seconds
const WICHTEL_CHECK_INTERVAL = 30 * 1000;
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
            message += `<@${participant.id}>, \`Friend-Code: ${sanitizeCodeSpan(participant.steamFriendCode)}\`\n`;
        }
        message = message.trimEnd();

        // Only the participants may be pinged, nothing else in the message (the global setting pings nobody).
        // The message is split, because a message may only have 2000 characters.
        const allowedMentions = { parse: [], users: participants.map(participant => String(participant.id)) };
        for (const part of splitMessage(message)) {
            await wichtelChannel.send({ content: part, allowedMentions });
        }
        return;
    }

    await wichtelChannel.send(message);
}

/**
 * Sends a participant the embed with their partner.
 *
 * @param {Array<Object>} match - The match as [giver, receiver].
 * @param {string} time - The time of the meeting.
 * @return {Promise<boolean>} True if the message was sent, false if it could not be sent (e.g. closed DMs).
 */
async function sendPartnerMessage(match, time) {
    const [giver, receiver] = match;

    try {
        const user = await localClient.users.fetch(giver.id);
        const matchEmbed = buildWichtelEmbed(receiver, time);

        logger.info(`Sending ${giver.dcName} their partner ${receiver.dcName}.`);

        await user.send({ embeds: [matchEmbed] });
        return true;
    } catch (error) {
        logger.warn(`Could not send ${giver.dcName} (${giver.id}) their partner: ${error}`, __filename);
        return false;
    }
}

/**
 * Deletes the wichtel message and sends the final message into the wichtel channel. Errors are logged, because the
 * partners must be informed anyway.
 *
 * @param {Object} wichtelChannel - The wichtel channel.
 * @param {Array<Object>} participants - The participants.
 * @param {string} time - The time of the meeting.
 * @return {Promise<void>} A promise that resolves when the channel is updated.
 */
async function updateWichtelChannel(wichtelChannel, participants, time) {
    try {
        const currentMessageID = await getId('wichtelId');
        const messages = await wichtelChannel.messages.fetch();

        if (messages.size !== 0 && messages.get(currentMessageID)) {
            await messages.get(currentMessageID).delete();
            logger.info('Deleted Wichtel message.');
        }

        await sendEndWichtelMessage(wichtelChannel, participants, time);
        await insertOrUpdateId('wichtelId', '');
    } catch (error) {
        logger.warn(`Could not update the wichtel channel: ${error}`, __filename);
    }
}

/**
 * Tells the channel which participants could not be informed about their partner (e.g. because of closed DMs).
 * The partners are NOT named.
 *
 * @param {Object} wichtelChannel - The wichtel channel.
 * @param {Array<Object>} failed - The participants that could not be informed.
 * @return {Promise<void>} A promise that resolves when the message was sent.
 */
async function notifyFailedMessages(wichtelChannel, failed) {
    try {
        await wichtelChannel.send({
            content: 'Diese Teilnehmer*innen konnten leider keine Nachricht mit ihrem\\*r Partner\\*in bekommen '
                + '(sind private Nachrichten von Servermitgliedern erlaubt?): '
                + `${failed.map(participant => `<@${participant.id}>`).join(', ')}\n`
                + 'Bitte meldet euch bei einem Admin.',
            allowedMentions: { parse: [], users: failed.map(participant => String(participant.id)) },
        });
    } catch (error) {
        logger.warn(`Could not send the list of failed messages: ${error}`, __filename);
    }
}

// True while a wichteln is being ended, so it can never be ended twice at the same time
let ending = false;

/**
 * Ends the Wichteln event: the event is marked as ended (before anything is sent, so it can never run twice),
 * the participants are matched and informed about their partners and the wichtel channel is updated.
 *
 * @return {Promise<string>} A message indicating the result of ending the Wichteln event.
 */
async function endWichteln() {
    if (ending) {
        return 'Das Wichteln wird gerade bereits beendet.';
    }
    ending = true;

    try {
        clearInterval(wichtelLoopId);

        const wichtelChannel = localClient.guilds.cache.get(getGuildId())
            .channels.cache.get(getWichtelChannelId());

        const wichtelData = await getWichtelData();

        if (wichtelData?.wichteln !== true) {
            logger.info('Tried to end the wichteln, but no wichteln is running.');
            return 'Es läuft derzeit kein Wichteln.';
        }

        if (wichtelChannel === undefined) {
            logger.warn(`The wichtel-channel with id ${getWichtelChannelId()} could not be found.`);
            return 'Der Wichtel-Channel konnte nicht gefunden werden!';
        }

        if (wichtelData.time === null) {
            logger.warn('Could not find wichtel_time');
            return 'Die wichtel_time konnte nicht gefunden werden!';
        }

        logger.info(`Ending Wichteln at ${new Date().toLocaleString()}`);

        const participants = await getParticipants();

        // Match participants (random, pairs of two that give each other are allowed)
        let matches = [];
        if (participants.length > 1) {
            let result = null;

            while (result === null) {
                result = matchParticipants(participants);
            }
            matches = result;

            // Saved first, so the matches are never lost (e.g. to send a message again by hand)
            await setWichtelMatches(matches.map(([giver, receiver]) => ({ giver: giver.id, receiver: receiver.id })));
        } else {
            logger.info('Not enough participants for wichteln');
        }

        // Mark the wichteln as ended before anything is sent
        await setWichtelData({ wichteln: false, end: '', time: '' });

        await updateWichtelChannel(wichtelChannel, participants, wichtelData.time);

        // Send messages with partners
        const failed = [];
        for (const match of matches) {
            if (!await sendPartnerMessage(match, wichtelData.time)) {
                failed.push(match[0]);
            }
        }

        if (failed.length > 0) {
            await notifyFailedMessages(wichtelChannel, failed);
        }

        return 'Das Wichteln wurde beendet!';
    } finally {
        ending = false;
    }
}

// True while a check of the wichtel loop is running, so checks never overlap
let loopRunning = false;

/**
 * Function to manage the automatic ending of the "wichtel" process based on a specified end date.
 * It retrieves the end date from the data store, compares it with the current date, and decides
 * whether to end the "wichtel" process or not. If no valid end date is found, it stops the loop.
 * Only one check runs at a time.
 *
 * @return {Promise<void>} A promise that resolves when the check is done.
 */
async function wichtelLoop() {
    if (loopRunning) {
        return;
    }
    loopRunning = true;

    try {
        const wichtelData = await getWichtelData();
        const endStr = wichtelData?.end;

        if (endStr && endStr.match(datePattern)) {
            const end = datetime.parse(endStr, 'DD.MM.YYYY, HH:mm:ss', false);
            const now = new Date();

            if (now > end) {
                logger.info('Ending "wichtelLoop"');
                await endWichteln();
                logger.info('"wichtelLoop" ended automatically');
            }
        } else {
            await setWichtelData({ wichteln: false, end: '', time: '' });
            logger.warn('No end date found in the wichtel data, "wichtelLoop" stopped.');
            clearInterval(wichtelLoopId);
        }
    } catch (error) {
        logger.warn(`Error in wichtelLoop: ${error}`, __filename);
    } finally {
        loopRunning = false;
    }
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
        // Never run two loops at the same time (e.g. if /wichteln is used again)
        clearInterval(wichtelLoopId);
        wichtelLoopId = setInterval(wichtelLoop, WICHTEL_CHECK_INTERVAL);
    }
}

module.exports = { startWichtelLoop, endWichteln };
