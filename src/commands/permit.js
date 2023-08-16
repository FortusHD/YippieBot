// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const data = require('../util/data.js');

// Frees a prisoner from the list
module.exports = {
	data: new SlashCommandBuilder()
		.setName('permit')
		.setDescription('Hiermit wird ein User repatriiert')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('Der User, der repatriiert werden soll')
				.setRequired(true)),
	async execute(interaction) {
		logger.info(`${interaction.member.user.tag} wants to permit a user.`);

		const user = interaction.options.getUser('user');
		const guild = interaction.guild;

		if (guild) {
			const member = guild.members.cache.get(user.id);

			if (member) {
				data.removePrisoner(member.id);
				logger.info(`${member.user.tag} was permitted by ${interaction.member.user.tag}.`);
				interaction.reply(`${member.user.tag} wurde repatriiert!`);
			} else {
				logger.info(`${interaction.member.user.tag} entered an invalid user.`);
				interaction.reply({ content: 'Du hast einen invaliden User angegeben!', ephemeral: true });
			}
		} else {
			logger.info(`${interaction.member.user.tag} tried to use the command outside a guild.`);
			interaction.reply({ content: 'Dieser Befehl kann nur auf Gilden ausgeführt werden!', ephemeral: true });
		}
	},
};