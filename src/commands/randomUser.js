// Imports
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../logging/logger.js');

// Chooses a random user from up to 10 options
module.exports = {
	data: new SlashCommandBuilder()
		.setName('randomuser')
		.setDescription('Wählt aus einer Eingabe zufällig einen User aus')
		.addUserOption(option =>
			option
				.setName('user1')
				.setDescription('Ein User der ausgewählt werden könnte')
				.setRequired(true))
		.addUserOption(option =>
			option
				.setName('user2')
				.setDescription('Ein User der ausgewählt werden könnte')
				.setRequired(true))
		.addUserOption(option =>
			option
				.setName('user3')
				.setDescription('Ein User der ausgewählt werden könnte')
				.setRequired(false))
		.addUserOption(option =>
			option
				.setName('user4')
				.setDescription('Ein User der ausgewählt werden könnte')
				.setRequired(false))
		.addUserOption(option =>
			option
				.setName('user5')
				.setDescription('Ein User der ausgewählt werden könnte')
				.setRequired(false))
		.addUserOption(option =>
			option
				.setName('user6')
				.setDescription('Ein User der ausgewählt werden könnte')
				.setRequired(false))
		.addUserOption(option =>
			option
				.setName('user7')
				.setDescription('Ein User der ausgewählt werden könnte')
				.setRequired(false))
		.addUserOption(option =>
			option
				.setName('user8')
				.setDescription('Ein User der ausgewählt werden könnte')
				.setRequired(false))
		.addUserOption(option =>
			option
				.setName('user9')
				.setDescription('Ein User der ausgewählt werden könnte')
				.setRequired(false))
		.addUserOption(option =>
			option
				.setName('user10')
				.setDescription('Ein User der ausgewählt werden könnte')
				.setRequired(false)),
	async execute(interaction) {
		logger.info(`${interaction.member.user.tag} wants to select a random user.`);

		const guild = interaction.guild;

		if (guild) {
			const users = [];

			// Load users
			for (let i = 1; i <= 10; i++) {
				const user = interaction.options.getUser(`user${i}`);
				if (user !== null && user !== undefined && user !== '') {
					users.push(user);
				}
			}

			// Check if there are any users in the list
			if (users.length > 0) {
				const randomUser = users[Math.floor(Math.random() * users.length)];

				logger.info(`${randomUser.username} was selected`);

				// TODO: Maybe some cool animation?

				const embed = new EmbedBuilder()
					.setColor(0x00AE86)
					.setTitle('Zufällig ausgewählter Benutzer')
					.setDescription(`Der zufällig ausgewählte Benutzer ist:\n<@${randomUser.id}>`)
					.setThumbnail(randomUser.displayAvatarURL({ dynamic: true }));

				interaction.reply({ embeds: [embed] });
			} else {
				logger.info(`${interaction.member.user.tag} did not give enough users to select from.`);
				interaction.reply({ content: 'Es wurden keine Benutzer zum Auswählen angegeben.', ephemeral: true });
			}
		} else {
			logger.info(`${interaction.member.user.tag} tried to use the command outside a guild.`);
			interaction.reply({ content: 'Dieser Befehl kann nur auf Gilden ausgeführt werden!', ephemeral: true });
		}
	},
};