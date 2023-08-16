// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const data = require('../util/data.js');

// Moves a user into the AFK-Channel and adds them to the prisoner list
module.exports = {
	data: new SlashCommandBuilder()
		.setName('deport')
		.setDescription('Hiermit wird ein User nach AFK deportiert')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('Der User, der deportiert werden soll')
				.setRequired(true)),
	async execute(interaction) {
		logger.info(`${interaction.member.user.tag} wants to deport a user.`);

		const user = interaction.options.getUser('user');
		const guild = interaction.guild;

		if (guild) {
			const afkChannel = guild.channels.cache.find(channel => channel.id === data.AFK_CHANNEL_ID);

			if (afkChannel) {
				const member = guild.members.cache.get(user.id);

				if (member) {
					// Add user ro prisoner list
					if (!data.isPrisoner(member.id)) {
						data.addPrisoner(member.id);
					}

					// Move user to AFK-Channel
					await member.voice.setChannel(afkChannel);

					logger.info(`${member.user.tag} was deported by ${interaction.member.user.tag}.`);
					interaction.reply(`${member.user.tag} wurde deportiert!`);
				} else {
					logger.info(`${interaction.member.user.tag} entered an invalid user.`);
					interaction.reply({ content: 'Du hast einen invaliden User angegeben!', ephemeral: true });
				}
			} else {
				logger.info(`The afk channel with id ${data.AFK_CHANNEL_ID} could not be found.`);
				interaction.reply({ content: 'Der AFK-Channel konnte nicht gefunden werden!', ephemeral: true });
			}
		} else {
			logger.info(`${interaction.member.user.tag} tried to use the command outside a guild.`);
			interaction.reply({ content: 'Dieser Befehl kann nur auf Gilden ausgeführt werden!', ephemeral: true });
		}
	},
};