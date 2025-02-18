// Imports
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const data = require('../util/data.js');
const config = require('config');

// Moves a user into the AFK-Channel and adds them to the prisoner list
module.exports = {
	guild: true,
	dm: false,
	data: new SlashCommandBuilder()
		.setName('deport')
		.setDescription('Hiermit wird ein User nach AFK deportiert')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('Der User, der deportiert werden soll')
				.setRequired(true)),
	async execute(interaction) {
		logger.info(`Handling deport command used by "${interaction.user.tag}".`);

		const user = interaction.options.getUser('user');
		const guild = interaction.guild;

		const afkChannel = guild.channels.cache
			.find(channel => channel.id === config.get('AFK_CHANNEL_ID'));

		if (afkChannel) {
			const member = guild.members.cache.get(user.id);

			if (member) {
				// Add user ro prisoner list
				if (!data.isPrisoner(member.id)) {
					data.addPrisoner(member.id);
				}

				// Move user to AFK-Channel
				await member.voice.setChannel(afkChannel);

				logger.info(`${member.user.tag} was deported by "${interaction.member.user.tag}".`);
				interaction.reply(`${member.user.tag} wurde deportiert!`);
			} else {
				logger.info(`"${interaction.member.user.tag}" entered an invalid user while deporting.`);
				interaction.reply({ content: 'Du hast einen invaliden User angegeben!', flags: MessageFlags.Ephemeral });
			}
		} else {
			logger.info(`The afk channel with id ${config.get('AFK_CHANNEL_ID')} could not be found while deporting.`);
			interaction.reply({ content: 'Der AFK-Channel konnte nicht gefunden werden!', flags: MessageFlags.Ephemeral });
		}
	},
};