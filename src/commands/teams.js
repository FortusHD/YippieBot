// Imports
const { SlashCommandBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../logging/logger.js');
const { randomizeTeams } = require('../util/teamRandomizer');

// Creates random generated teams for a number of teams and given participants
module.exports = {
    guild: true,
    dm: true,
    help: {
        usage: '/teams <team-number> <participants>',
        examples: '`/teams team-number:2 participants:1,2,3,4` | '
            + '`/teams team-number:3 participants:a, b, c, d, e, f, g`',
        notes: 'Die Teams werden immer gleich verteilt,. Falls die Anzahl der Teilnehmer nicht auf die Anzahl '
            + 'der Teams passt, werden die restlichen Teilnehmer gleichmäßig in die Teams verteilt.',
    },
    data: new SlashCommandBuilder()
        .setName('teams')
        .setDescription('Erstelle zufällig generierte Teams')
        .addIntegerOption(option =>
            option
                .setName('team-number')
                .setDescription('Anzahl an Teams')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('participants')
                .setDescription('Alle Mitglieder, die in die Teams sortiert werden sollen (mit "," getrennt)')
                .setRequired(true)),
    async execute(interaction) {
        logger.info(`Handling teams command used by "${interaction.user.tag}".`);

        const teamNr = interaction.options.getInteger('team-number');
        const participants = interaction.options.getString('participants').split(',').map(obj => obj.trim());

        logger.debug(`Got following data: teamNr: ${teamNr}, `
            + `participants: [${participants.join(', ')}]`, __filename);

        const teamsEmbed = randomizeTeams(participants, teamNr);

        if (!teamsEmbed) {
            logger.info(`"${interaction.user.tag}" requested teams, but team number was not greater `
                    + 'than 0 or not enough participants where entered.');
            await interaction.reply({
                content: 'Die Anzahl an Teams muss größer als 0 sein und es müssen mindestens so viele Mitglieder '
                        + 'angegeben werden, wie es Teams gibt!',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // Create the reshuffle button
        const reshuffleButton = new ButtonBuilder()
            .setCustomId('reshuffleteams')
            .setLabel('Teams neu mischen')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder()
            .addComponents(reshuffleButton);

        await interaction.reply({
            embeds: [teamsEmbed],
            components: [row],
        });
    },
};
