// Imports
const { ActionRowBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');
const datetime = require('date-and-time');
const logger = require('../logging/logger');
const { editInteractionReply } = require('../util/util');
const { getGuildId, getWichtelChannelId, getEnv } = require('../util/config');
const { handleError, ErrorType } = require('../logging/errorHandler');
const { startWichtelLoop } = require('../threads/wichtelLoop');
const participateButton = require('../buttons/participateButton');
const participantsButton = require('../buttons/participantsButton');
const { buildEmbed } = require('../util/embedBuilder');
const { resetParticipants } = require('../database/tables/wichtelParticipants');
const { insertOrUpdateId } = require('../database/tables/messageIDs');
const { setWichtelData } = require('../database/tables/dataStore');

/**
 * Adds a specified number of days to a given date.
 *
 * @param {Date} dateToAdd - The initial date to which days will be added.
 * @param {number} days - The number of days to add to the date.
 * @return {Date} The new date after adding the specified number of days.
 */
function addDays(dateToAdd, days) {
    const date = new Date(dateToAdd);
    date.setDate(date.getDate() + days);
    logger.debug(`Added ${days} days to ${date.toISOString()}`, __filename);
    return date;
}

/**
 * Adds 2 minutes to the provided date.
 *
 * @param {Date} dateToAdd - The date to which 2 minutes will be added. It can be a date string or a Date object.
 * @return {Date} - A new Date object representing the original date plus 2 minutes.
 */
function addTestTime(dateToAdd) {
    const date = new Date(dateToAdd);
    date.setTime(date.getTime() + 2 * 60 * 1000);
    logger.debug(`Added 2 min to ${date.toISOString()}`, __filename);
    return date;
}

// Starts the wichteln
module.exports = {
    guild: true,
    dm: true,
    devOnly: true,
    help: {
        category: 'Admin',
        usage: '/wichteln <wichtel-date> <participating-time>',
        examples: '`/wichteln wichtel-date:12.12.2021, 12:00 participating-time:7`',
        notes: 'Der Wichtel-Channel muss vorher erstellt werden. Wenn `TEST_WICHTELN` aktiviert ist, '
            + 'startet das Wichteln in 2 Minuten.',
    },
    data: new SlashCommandBuilder()
        .setName('wichteln')
        .setDescription('Startet das Wichteln')
        .setContexts([0, 1])
        .addStringOption(option =>
            option
                .setName('wichtel-date')
                .setDescription('Datum und Uhrzeit an dem das Wichteln starten soll (DD.MM.YYYY, HH:mm)')
                .setRequired(true))
        .addIntegerOption(option =>
            option
                .setName('participating-time')
                .setDescription('Anzahl an Tagen, die Allen zum Teilnehmen zur Verfügung steht')
                .setRequired(true)),
    async execute(interaction) {
        logger.info(`Handling wichtel command used by "${interaction.user.tag}".`);

        await interaction.reply('Wichteln wird gestartet');

        const datetimeRegex = '[0-3][0-9].[0-1][0-9].[0-9][0-9][0-9][0-9], [0-2][0-9]:[0-5][0-9]';
        const startTimeStr = interaction.options.getString('wichtel-date');
        const participatingTime = interaction.options.getInteger('participating-time');

        logger.debug(`Got following data: startTimeStr: ${startTimeStr}, `
            + `participatingTime: ${participatingTime}`, __filename);

        // Check if start time has the correct form
        if (startTimeStr.match(datetimeRegex)) {
            const wichtelChannel = interaction.client.guilds.cache.get(getGuildId())
                .channels.cache.get(getWichtelChannelId());

            // Check if the channel does exist
            if (wichtelChannel) {
                // Reset
                await resetParticipants();

                // Generate end time (in the case of testing, time can be set to only 2 minutes in the future)
                let participatingEnd = new Date();

                if (getEnv('TEST_WICHTELN') !== 'true') {
                    participatingEnd = addDays(participatingEnd, participatingTime);
                    participatingEnd.setHours(23, 59, 59);
                } else {
                    participatingEnd = addTestTime(participatingEnd);
                }

                // Build embed
                const row = new ActionRowBuilder()
                    .addComponents(participateButton.data, participantsButton.data);

                // Send Embed
                const wichtelEmbed = buildEmbed({
                    color: 0xDB27B7,
                    title: 'Wichteln',
                    description: 'Es ist wieder so weit. Wir wichteln dieses Jahr wieder mit **Schrottspielen**!\n'
						+ 'Es geht also darum möglichst beschissene Spiele zu verschenken.\n\n'
						+ `Wir treffen uns am **${startTimeStr.split(', ')[0]} um `
						+ `${startTimeStr.split(', ')[1]} Uhr**. Dann werden wir zusammen die Spiele `
						+ '2 Stunden lang spielen und uns gegenseitig beim Leiden zuschauen können.\n'
						+ 'Wer an diesem Tag nicht kann, muss sich keine Sorgen machen. Man kann das Spiel gerne auch '
						+ 'zu einem anderen Zeitpunkt spielen. Es macht aber am meisten Spaß, wenn die Person, die '
						+ 'einem das Spiel geschenkt hat, dabei ist.\n\nIhr habt bis zum '
						+ `**${datetime.format(participatingEnd, 'DD.MM.YYYY')} um 23:59 Uhr** Zeit, `
						+ 'um euch anzumelden. Dazu müsst ihr einfach nur den Knopf drücken!\n',
                    origin: this.data.name,
                });
                wichtelChannel.send({ embeds: [wichtelEmbed], components: [row] }).then(message => {
                    insertOrUpdateId('wichtelId', message.id);
                }).catch(err => {
                    handleError(err, __filename, {
                        type: ErrorType.MESSAGE_NOT_SENT,
                        interaction,
                        context: { command: 'wichteln', channel: wichtelChannel.id },
                    });
                });

                // Save end-time and time for private messages in JSON
                await setWichtelData({
                    wichteln: true,
                    end: datetime.format(participatingEnd, 'DD.MM.YYYY, HH:mm:ss'),
                    time: `${startTimeStr.split(', ')[0]} um ${startTimeStr.split(', ')[1]} Uhr`,
                });

                // Start loop to check for the end of wichteln
                await startWichtelLoop(interaction.client);

                await editInteractionReply(interaction, 'Das Wichteln wurde gestartet.');

                logger.info(`Wichteln was started by "${interaction.user.tag}".`);
            } else {
                logger.info(`The wichtel-channel with id ${getWichtelChannelId()} could not be found.`);
                await editInteractionReply(interaction, {
                    content: 'Der Wichtel-Channel konnte nicht gefunden werden!',
                    flags: MessageFlags.Ephemeral,
                });
            }
        } else {
            logger.info(`"${interaction.user.tag}" entered a datetime with wrong regex when starting the wichteln.`);
            await editInteractionReply(interaction, {
                content: 'Du hast das "wichtel-date" falsch angegeben!',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};