const { shuffleArray } = require('./util');
const logger = require('../logging/logger');
const { buildEmbed } = require('./embedBuilder');

/**
 * Randomizes participants into a specified number of teams and returns an embed containing the team details.
 *
 * @param {Array<string>} participants - An array of participant names to be divided into teams.
 * @param {number} teamNr - The number of teams to create.
 * If set to 0 or insufficient participants, no teams are created.
 * @return {Object|null} Returns an embed object containing the team information if teams are created,
 * otherwise returns null.
 */
function randomizeTeams(participants, teamNr) {
    const teamSize = teamNr > 0 ? Math.floor(participants.length / teamNr) : 0;

    if (teamSize > 0 && participants.length > teamSize) {
        const shuffled = shuffleArray(participants);

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
        return buildEmbed({
            color: teamColors[Math.floor(Math.random() * teamColors.length)],
            title: 'Das sind die Teams:',
            description: `Zufällig generierte Teams für ${participants.length} Teilnehmer in ${teamNr} Teams.`,
            origin: 'teams',
            fields: teamFields,
        });
    } else {
        return null;
    }
}

module.exports = { randomizeTeams };