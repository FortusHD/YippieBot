// Imports
const { ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const logger = require('../logging/logger');
const { randomizeTeams } = require('../util/teamRandomizer');

// Button to reshuffle teams
module.exports = {
    data: new ButtonBuilder()
        .setCustomId('reshuffleteams')
        .setLabel('Teams neu mischen')
        .setStyle(ButtonStyle.Primary),
    async execute(interaction) {
        logger.info(`Handling reshuffleTeams button pressed by "${interaction.user.tag}".`);

        // Extract the original data from the embed
        const embed = interaction.message.embeds[0];
        if (!embed) {
            await interaction.reply({
                content: 'Die Teams konnten nicht neu gemischt werden.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // Parse the description to get the number of participants and teams
        const descriptionMatch = embed.description.match(/(\d+) Teilnehmer in (\d+) Teams/);
        if (!descriptionMatch) {
            await interaction.reply({
                content: 'Die Teams konnten nicht neu gemischt werden.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const participantCount = parseInt(descriptionMatch[1], 10);
        const teamCount = parseInt(descriptionMatch[2], 10);

        // Extract all participants from the team fields
        const allParticipants = [];
        embed.fields.forEach(field => {
            const teamMembers = field.value.split(', ');
            allParticipants.push(...teamMembers);
        });

        // Ensure we have the correct number of participants
        if (allParticipants.length !== participantCount) {
            await interaction.reply({
                content: 'Die Teams konnten nicht neu gemischt werden.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const teamsEmbed = randomizeTeams(allParticipants, teamCount);

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

        // Update the message with the new teams
        await interaction.update({
            embeds: [teamsEmbed],
            components: [{ type: 1, components: [reshuffleButton] }],
        });

        logger.info(`"${interaction.user.tag}" reshuffled teams.`);
    },
};