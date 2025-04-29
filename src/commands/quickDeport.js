// Imports
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const { getAfkChannelId } = require('../util/config');

// Moves a user to the AFK-Channel
module.exports = {
	guild: true,
	dm: false,
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

		const afkChannel = guild.channels.cache
			.find(channel => channel.id === getAfkChannelId());

		if (afkChannel) {
			const member = guild.members.cache.get(user.id);

			if (member) {
				if (member.voice.channel) {
					await member.voice.setChannel(afkChannel);
				}

				logger.info(`"${member.user.tag}" was moved by "${interaction.member.user.tag}".`);
				interaction.reply(`${member.user.tag} wurde verschoben!`);
			} else {
				logger.info(`"${interaction.member.user.tag}" entered an invalid user when quickDeporting.`);
				interaction.reply({ content: 'Du hast einen invaliden User angegeben!', flags: MessageFlags.Ephemeral });
			}
		}
	},
};