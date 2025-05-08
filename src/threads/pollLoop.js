// Imports
const logger = require('../logging/logger');
const { checkPollsEnd } = require('../util/json_manager');
const { buildEmbed } = require('../util/util');

let localClient = null;

/**
 * Processes and concludes active polls, retrieves polling data, and sends the results to the corresponding channels.
 * It fetches messages related to ended polls, analyzes reactions for voting counts, constructs a result message,
 * and dispatches the results.
 *
 * @return {void} This method does not return a value as it performs asynchronous operations to process active polls
 * and send results.
 */
function pollLoop() {
    const removedPolls = checkPollsEnd();

    removedPolls.forEach(poll => {
        localClient.channels.fetch(poll.channelId).then(async channel => {
            const pollMessage = await channel.messages.fetch(poll.messageId);

            const question = pollMessage.embeds[0].description;
            const answersRaw = pollMessage.embeds[0].fields[0].value.split('\n');

            const answers = [];
            const answersString = [];

            for (let i = 0; i < answersRaw.length; i++) {
                answers.push({
                    emoji: answersRaw[i].split(' ')[0],
                    text: answersRaw[i].split(' ').slice(1).join(' '),
                    count: pollMessage.reactions.resolve(answersRaw[i].split(' ')[0]).count - 1,
                });
            }

            answers.sort((a, b) => b.count - a.count).forEach(answer => {
                answersString.push(`${answer.emoji} ${answer.text} - ${answer.count}`);
            });

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
        });
    });
}

/**
 * Starts the poll loop by initiating a periodic execution of the `pollLoop` function.
 * This method logs the start of the poll loop and sets an interval to execute the function every second.
 *
 * @return {void} No return value.
 */
async function startPollLoop(client) {
    logger.info('Starting "pollLoop"');
    localClient = client;
    setInterval(pollLoop, 1000);
}

module.exports = { startPollLoop };