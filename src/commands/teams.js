// Imports
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

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
				.setDescription('Alle Mitglieder, die in die Teams sortiert werden sollen (mit Leerzeichen getrennt)')
				.setRequired(true)),
	async execute(interaction) {
		logger.info(`Handling teams command used by "${interaction.user.tag}".`);

		const teamNr = interaction.options.getInteger('team-number');
		const participants = interaction.options.getString('participants').split(' ');

		const shuffled = shuffleParticipants(participants);
		const teamSize = Math.floor(participants.length / teamNr);

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

			let log_message = `${teamNr} team(s) where created from ${participants}: `;

			const teamsEmbed = new EmbedBuilder()
				.setColor(0x3c00d6)
				.setTitle('Das sind die Teams:');

			teams.forEach((team, index) => {
				teamsEmbed.addFields({ name: `Team${index + 1}`, value:  team.join(', ') });
				log_message += `[${team.join(', ')}], `;
			});

			logger.info(log_message.substring(0, log_message.length - 2));

			await interaction.reply({ embeds: [teamsEmbed] });
		} else {
			logger.info(`"${interaction.member.user.tag}" requested teams, but team number was not greater than 0 or not enough participants where entered.`);
			await interaction.reply({
				content: 'Die Anzahl an Teams muss größer als 0 sein und es müssen mindestens so viele Mitglieder angegeben werden, wie es Teams gibt!',
				ephemeral: true
			});
		}
	},
};

/**
 * Randomly shuffles the elements of the given array of participants.
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