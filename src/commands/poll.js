// Imports
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const { addPoll } = require('../util/json_manager');
const { handleError, ErrorType } = require('../logging/errorHandler');
const { buildEmbed } = require('../util/embedBuilder');

/**
 * Creates a Unix timestamp by adding the specified amount of time to the current date.
 *
 * @param {string} timeAdded - The amount of time to add.
 * @param {string} timeUnit - The unit of time ('d' for days, 'h' for hours, 'm' for minutes).
 * @return {number} Unix timestamp in seconds.
 */
function createUnixTimestamp(timeAdded, timeUnit) {
    const date = new Date();
    const time = parseInt(timeAdded, 10);

    switch (timeUnit) {
    case 'd':
        date.setDate(date.getDate() + time);
        break;
    case 'h':
        date.setHours(date.getHours() + time);
        break;
    case 'm':
    default:
        date.setMinutes(date.getMinutes() + time);
        break;
    }

    date.setSeconds(0, 0);
    return Math.floor(date.getTime() / 1000);
}

// Starts a poll with up to 15 options, the result will be sent once end time is passed
module.exports = {
    guild: true,
    dm: false,
    help: {
        category: 'Sonstiges',
        usage: '/poll <question> <time> <answer1> <answer2> <max_votes> [answer3..15]',
        examples: '`/poll question:Alles klar? time:1h answer1::one: Ja answer2::two: Nein` |'
            + '`/poll question:Alles klar? time:2d answer1::one: Ja answer2::two: Nein '
            + 'max_votes:1 answer3::three: Vielleicht`',
        notes: 'Die Abstimmung kann zwischen 2 und 15 Antworten haben. '
            + 'Die gegebene Zeit kann in Tagen, Stunden oder Minuten angegeben werden.',
    },
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Startet eine Abstimmung in diesem Channel')
        .addStringOption(option =>
            option
                .setName('question')
                .setDescription('Die Frage, über die abgestimmt werden soll')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('time')
                .setDescription('Zeit für die Abstimmung (d, h oder m)')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('answer1')
                .setDescription('Antwort 1 (emoji) (text)')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('answer2')
                .setDescription('Antwort 2 (emoji) (text)')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('max_votes')
                .setDescription('Anzahl der Stimmen')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('answer3')
                .setDescription('Antwort 3 (emoji) (text)')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('answer4')
                .setDescription('Antwort 4 (emoji) (text)')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('answer5')
                .setDescription('Antwort 5 (emoji) (text)')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('answer6')
                .setDescription('Antwort 6 (emoji) (text)')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('answer7')
                .setDescription('Antwort 7 (emoji) (text)')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('answer8')
                .setDescription('Antwort 8 (emoji) (text)')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('answer9')
                .setDescription('Antwort 9 (emoji) (text)')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('answer10')
                .setDescription('Antwort 10 (emoji) (text)')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('answer11')
                .setDescription('Antwort 11 (emoji) (text)')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('answer12')
                .setDescription('Antwort 12 (emoji) (text)')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('answer13')
                .setDescription('Antwort 13 (emoji) (text)')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('answer14')
                .setDescription('Antwort 14 (emoji) (text)')
                .setRequired(false))
        .addStringOption(option =>
            option
                .setName('answer15')
                .setDescription('Antwort 15 (emoji) (text)')
                .setRequired(false)),
    async execute(interaction) {
        logger.info(`Handling poll command used by "${interaction.user.tag}".`);

        await interaction.reply({ content: 'Abstimmung wird gestartet!', flags: MessageFlags.Ephemeral });

        // Basic data
        const channel = interaction.channel;
        const question = interaction.options.getString('question');
        const time = interaction.options.getString('time');
        const maxVotes = interaction.options.getInteger('max_votes');

        const dmChannel = await interaction.member.user.createDM();

        logger.debug(`Got following data: channel: ${channel.name}, question: ${question}, time: ${time}, `
            + `maxVotes: ${maxVotes}, dmChannel: ${dmChannel.id}`, __filename);

        // Init
        const rawAnswers = [];
        const answers = [];
        const emojiSet = new Set();

        // Load raw answers for error messages
        for (let i = 1; i <= 15; i++) {
            const answer = interaction.options.getString(`answer${i}`);
            if (answer !== null && answer !== undefined && answer !== '') {
                rawAnswers.push(answer);
            }
        }

        logger.debug(`entered answers: [${rawAnswers.join(', ')}]`, __filename);

        // Build the error embed here, for later use
        const answersString = rawAnswers.map((answer, index) => `**answer${index + 1}**: ${answer}`).join('\n');
        const errorEmbed = buildEmbed({
            color: 0xed1010,
            title: 'Deine Eingaben',
            description: `**question**: ${question}\n**time**: ${time}\n`
				+ `${maxVotes ? `**max_votes**: ${maxVotes}\n` : ''}${answersString}`,
            origin: this.data.name,
        });

        // Collect all answers and check for validity
        for (let i = 1; i <= rawAnswers.length; i++) {
            const answer = rawAnswers[i - 1];
            const split = answer.split(' ');
            const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/ug;
            const customEmojiRegex = /<a?:.+:\d+>/u;

            // Answer must consist of an emoji follow by some string
            if (split.length > 1 && (emojiRegex.test(split[0]) || customEmojiRegex.test(split[0]))) {
                // Emojis here are used for identifying, so they must be unique
                if (emojiSet.has(split[0])) {
                    await dmChannel.send({
                        content: `Das Emoji für Antwort ${i} wurde bereits verwendet. `
                            + 'Bitte wähle ein anderes Emoji.',
                        embeds: [errorEmbed],
                    });
                    return;
                }
                emojiSet.add(split[0]);
                answers.push(answer);
            } else {
                await dmChannel.send({
                    content: `Bei deinem Poll hast du bei Antwort ${i} nicht das richtige Format befolgt. `
                        + 'Bitte stelle sicher, dass die Antwort folgende Form hat: (emoji) (text)',
                    embeds: [errorEmbed],
                });
                return;
            }
        }

        const timeRegex = /\d+[dhm]/;

        // Check if time was given correctly
        if (timeRegex.test(time)) {
            const timeNumber = time.substring(0, time.length - 1);
            const timeUnit = time.substring(time.length - 1);

            const timestamp = createUnixTimestamp(timeNumber, timeUnit);
            const timestampString = `<t:${timestamp}:R>`;

            const pollEmbed = buildEmbed({
                color: 0x2210e8,
                title: 'Umfrage',
                description: question,
                origin: this.data.name,
                fields: [
                    { name: 'Antwortmöglichkeiten', value: answers.join('\n'), inline: false },
                    { name: 'Infos', value: `:alarm_clock: Ende: ${timestampString}\n:ballot_box_with_check: `
                    	+ `Anzahl an Stimmen: ${maxVotes ? maxVotes : '∞'}`, inline: false },
                ],
            });

            channel.send({ embeds: [pollEmbed] }).then(message => {
                addPoll(message.id, channel.id, timestamp, maxVotes);

                for (let i = 0; i < answers.length; i++) {
                    message.react(answers[i].split(' ')[0]);
                }

                logger.info(`"${interaction.user.tag}" started a poll with ${answers.length} answers.`);
            }).catch(err => {
                handleError(err, __filename, {
                    type: ErrorType.MESSAGE_NOT_SENT,
                    interaction,
                    context: { command: 'poll', channel: channel.id },
                });
            });
        } else {
            await dmChannel.send({
                content: 'Bei deinem Poll hast du die Zeit falsch angegeben. Erlaubt ist nur dieses Format: '
				+ '7d, 10h oder 33m',
                embeds: [errorEmbed],
            });
            logger.info(`"${interaction.user.tag}" tried to start a poll with invalid time format.`);
        }
    },
};

