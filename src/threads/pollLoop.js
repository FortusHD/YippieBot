// Imports
const logger = require('../logging/logger');
const { buildEmbed } = require('../util/embedBuilder');
const { getEndedPolls, deletePoll } = require('../database/tables/polls');

const POLL_CHECK_INTERVAL = 15 * 1000;
const MAX_ATTEMPTS = 5;
// Discord error codes for "Unknown Channel" and "Unknown Message"
const UNKNOWN_CHANNEL = 10003;
const UNKNOWN_MESSAGE = 10008;

let localClient = null;
let running = false;
// Counts failed attempts per poll, so a broken poll doesn't block the loop forever
const attempts = new Map();

/**
 * Error for a poll message, whose embed does not have the expected structure. Retrying never helps in this case.
 */
class InvalidPollEmbedError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InvalidPollEmbedError';
    }
}

// An answer line is "(emoji) (text)", the emoji is either a unicode emoji or a custom emoji (<:name:id>)
const ANSWER_LINE_REGEX = /^(\S+) (\S.*)$/u;

/**
 * Reads the question and the answers from the embed of a poll message and validates its structure.
 *
 * @param {import(discord.js).Message} pollMessage - The poll message.
 * @return {{question: string, answers: Array<{emoji: string, text: string}>}} The question and the answers.
 * @throws {InvalidPollEmbedError} If the embed does not have the expected structure.
 */
function parsePollEmbed(pollMessage) {
    const embed = pollMessage?.embeds?.[0];

    if (!embed) {
        throw new InvalidPollEmbedError('The poll message has no embed.');
    }
    if (typeof embed.description !== 'string' || embed.description.length === 0) {
        throw new InvalidPollEmbedError('The embed of the poll has no question.');
    }

    // The answers are in the first field
    const answersField = embed.fields?.[0];
    if (!answersField || typeof answersField.value !== 'string') {
        throw new InvalidPollEmbedError('The embed of the poll has no answers field.');
    }

    const answers = answersField.value.split('\n').map((line, index) => {
        const match = ANSWER_LINE_REGEX.exec(line);
        if (!match) {
            throw new InvalidPollEmbedError(`Answer ${index + 1} of the poll has an invalid format: "${line}"`);
        }
        return { emoji: match[1], text: match[2] };
    });

    return { question: embed.description, answers };
}

/**
 * Evaluates a single ended poll and sends the result into the channel of the poll.
 *
 * @param {Object} poll - The poll from the database.
 * @return {Promise<void>} A promise that resolves when the result was sent.
 */
async function processPoll(poll) {
    const channel = await localClient.channels.fetch(poll.channelId);
    const pollMessage = await channel.messages.fetch(poll.messageId);

    const { question, answers: parsedAnswers } = parsePollEmbed(pollMessage);

    const answers = [];
    const answersString = [];

    for (const { emoji, text } of parsedAnswers) {
        const reaction = pollMessage.reactions.resolve(emoji);

        answers.push({
            emoji,
            text,
            // The own reaction of the bot is not counted; the reaction may be missing if it was removed
            count: reaction ? Math.max(reaction.count - 1, 0) : 0,
        });
    }

    answers.sort((a, b) => b.count - a.count).forEach(answer => {
        answersString.push(`${answer.emoji} ${answer.text} - ${answer.count}`);
    });

    logger.debug(`Answers: [${answersString.join(', ')}]`, __filename);

    const resultEmbed = buildEmbed({
        color: 0x2210e8,
        title: 'Umfrage-Ergebnisse',
        description: question,
        origin: 'poll',
        fields: [
            { name: 'Ergebnis', value: answersString.join('\n'), inline: false },
        ],
    });

    await channel.send({ embeds: [resultEmbed] });
}

/**
 * Processes and concludes ended polls. A poll is only removed from the database after its result was sent
 * (or if the poll message/channel does not exist anymore or it failed too often).
 *
 * @return {Promise<void>} A promise that resolves when all ended polls were handled.
 */
async function pollLoop() {
    // Don't start a new run while the last one is still going
    if (running) {
        return;
    }
    running = true;

    try {
        const endedPolls = await getEndedPolls();

        if (endedPolls.length > 0) {
            logger.debug(`Ended polls: ${endedPolls.map(poll => poll.messageId).join(', ')}`, __filename);
        }

        for (const poll of endedPolls) {
            try {
                await processPoll(poll);
                attempts.delete(poll.messageId);
                await deletePoll(poll.messageId);
            } catch (error) {
                const gone = error?.code === UNKNOWN_CHANNEL || error?.code === UNKNOWN_MESSAGE;
                const invalid = error instanceof InvalidPollEmbedError;
                const failed = (attempts.get(poll.messageId) ?? 0) + 1;
                attempts.set(poll.messageId, failed);

                if (gone || invalid || failed >= MAX_ATTEMPTS) {
                    logger.warn(`Dropping poll ${poll.messageId}: ${gone ? 'message or channel is gone' : error}`,
                        __filename);
                    attempts.delete(poll.messageId);
                    await deletePoll(poll.messageId);
                } else {
                    logger.warn(`Could not evaluate poll ${poll.messageId} (attempt ${failed}/${MAX_ATTEMPTS}): `
                        + `${error}`, __filename);
                }
            }
        }
    } catch (error) {
        logger.warn(`Error in pollLoop: ${error}`, __filename);
    } finally {
        running = false;
    }
}

/**
 * Starts the poll loop by initiating a periodic execution of the `pollLoop` function.
 * This method logs the start of the poll loop and sets an interval to execute the function every 15 seconds.
 *
 * @param {import(discord.js).Client} client - The client used to fetch channels.
 * @return {void} No return value.
 */
async function startPollLoop(client) {
    logger.info('Starting "pollLoop"');
    localClient = client;
    setInterval(pollLoop, POLL_CHECK_INTERVAL);
}

module.exports = { startPollLoop, parsePollEmbed, InvalidPollEmbedError };
