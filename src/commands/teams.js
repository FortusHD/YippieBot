// Imports
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const { buildEmbed } = require('../util/util');

/**
 * Randomly shuffles the elements of the given array (participants).
 *
 * @param {Array} participants - The array of participants to be shuffled.
 * @return {Array} The shuffled array of participants.
 */
function shuffleParticipants(participants) {
    for (let i = participants.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [participants[i], participants[j]] = [participants[j], participants[i]];
    }
    return participants;
}

// Creates random generated teams for a number of teams and given participants
module.exports = {
    guild: true,
    dm: true,
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

        const shuffled = shuffleParticipants(participants);
        const teamSize = teamNr > 0 ? Math.floor(participants.length / teamNr) : 0;

        if (teamSize > 0 && participants.length > teamSize) {

            // Add participants to teams
            const teams = [];
            for (let i = 0; i < teamNr; i++) {
                const startIndex = i * teamSize;
                const endIndex = startIndex + teamSize;
                const team = shuffled.slice(startIndex, endIndex);
                teams.push(team);
            }

            const remainingParticipants = shuffled.slice(teamSize * teamNr);
            for (let i = 0; i < remainingParticipants.length; i++) {
                const teamIndex = i % teamNr;
                teams[teamIndex].push(remainingParticipants[i]);
            }

            let logMessage = `${teamNr} team(s) where created from ${participants}: `;

            const teamFields = [];
            teams.forEach((team, index) => {
                teamFields.push({ name: `Team ${index + 1}`, value: team.join(', ') });
                logMessage += `[${team.join(', ')}], `;
            });
            logger.info(logMessage.substring(0, logMessage.length - 2));

            // Some colors for team embeds, to have a bit of variety
            const teamColors = [0x008080, 0x0000FF, 0x800080, 0xFFA500, 0x00FF00, 0x800000, 0xFF0000];
            const teamsEmbed = buildEmbed({
                color: teamColors[Math.floor(Math.random() * teamColors.length)],
                title: 'Das sind die Teams:',
                description: `Zufällig generierte Teams für ${participants.length} Teilnehmer in ${teamNr} Teams.`,
                origin: this.data.name,
                fields: teamFields,
            });
            await interaction.reply({ embeds: [teamsEmbed] });
        } else {
            logger.info(`"${interaction.user.tag}" requested teams, but team number was not greater `
				+ 'than 0 or not enough participants where entered.');
            await interaction.reply({
                content: 'Die Anzahl an Teams muss größer als 0 sein und es müssen mindestens so viele Mitglieder '
					+ 'angegeben werden, wie es Teams gibt!',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};