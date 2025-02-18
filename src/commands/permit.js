// Imports
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const data = require('../util/data.js');

// Frees a prisoner from the list
module.exports = {
	guild: true,
	dm: false,
	data: new SlashCommandBuilder()
		.setName('permit')
		.setDescription('Hiermit wird ein User repatriiert')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('Der User, der repatriiert werden soll')
				.setRequired(true)),
	async execute(interaction) {
		logger.info(`Handling permit command used by "${interaction.user.tag}".`);

		const user = interaction.options.getUser('user');
		const guild = interaction.guild;
		const member = guild.members.cache.get(user.id);

		if (member) {
			data.removePrisoner(member.id);
			logger.info(`"${member.user.tag}" was permitted by "${interaction.member.user.tag}".`);
			interaction.reply(`${member.user.tag} wurde repatriiert!`);
		} else {
			logger.info(`"${interaction.member.user.tag}" entered an invalid user.`);
			interaction.reply({ content: 'Du hast einen invaliden User angegeben!', flags: MessageFlags.Ephemeral });
		}
	},
};