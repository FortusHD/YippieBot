// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const config = require('config');

// Moves a user to the AFK-Channel
module.exports = {
	data: new SlashCommandBuilder()
		.setName('quick-deport')
		.setDescription('Hiermit wird ein User nach AFK verschoben')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('Der User, der verschoben werden soll')
				.setRequired(true)),
	async execute(interaction) {
		logger.info(`Handling quickDeport command used by "${interaction.user.tag}".`);

		const user = interaction.options.getUser('user');
		const guild = interaction.guild;

		if (guild) {
			const afkChannel = guild.channels.cache
				.find(channel => channel.id === config.get('AFK_CHANNEL_ID'));

			if (afkChannel) {
				const member = guild.members.cache.get(user.id);

				if (member) {
					await member.voice.setChannel(afkChannel);

					logger.info(`"${member.user.tag}" was moved by "${interaction.member.user.tag}".`);
					interaction.reply(`${member.user.tag} wurde verschoben!`);
				} else {
					logger.info(`"${interaction.member.user.tag}" entered an invalid user when quickDeporting.`);
					interaction.reply({ content: 'Du hast einen invaliden User angegeben!', ephemeral: true });
				}
			}
		} else {
			logger.info(`"${interaction.member.user.tag}" tried to use the command outside a guild when quickDeporting.`);
			interaction.reply({ content: 'Dieser Befehl kann nur auf Servern ausgeführt werden!', ephemeral: true });
		}
	},
};