// Imports
const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const logger = require('../logging/logger.js');
const { buildEmbed, getRandomColor } = require('../util/util');
require('dotenv').config();


// Chooses a random user from up to 10 options
module.exports = {
	guild: true,
	dm: false,
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
		logger.info(`Handling randomUser command used by "${interaction.user.tag}".`);
		await interaction.deferReply();
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
			const avatars = users.map(user => user.displayAvatarURL({ extension: 'png', forceStatic: true, size: 256 }));
			const formattedAvatars = JSON.stringify(avatars);

			let config = {
				method: 'post',
				maxBodyLength: Infinity,
				url: process.env.GIF_CREATOR,
				headers: { 'Content-Type': 'application/json' },
				data : formattedAvatars
			};

			axios.request(config)
				.then(async response => {
					// Tell ImageServer to create GIF and receive filename
					const avatarsGif = response.data.filename;
					const randomUserEmbed = buildEmbed({
						color: getRandomColor(),
						title: 'Zufälliger Benutzer wird ausgewählt...',
						description: `${users.map(user => `<@${user.id}>`).join(', ')}`,
						origin: this.data.name,
						image: `https://images.fortusweb.de/bot_gifs/${avatarsGif}`
					});
					const sentMessage = await interaction.editReply({ embeds: [randomUserEmbed]});

					// Replace GIF of all possible users with winner
					setTimeout(async () => {
						const randomUser = users[Math.floor(Math.random() * users.length)];
						logger.info(`${randomUser.username} was selected`);

						randomUserEmbed.setTitle('Das Ergebnis der Ziehung ist...');
						randomUserEmbed.setDescription(`<@${randomUser.id}> wurde ausgewählt! :tada:`);
						randomUserEmbed.setImage(randomUser.displayAvatarURL({ size: 256 }));

						await sentMessage.edit({ embeds: [randomUserEmbed] });
						logger.info(`"${interaction.member.user.tag}" got "${randomUser.username}" as a random user.`);
					}, 7500);
				})
				.catch(async error => {
					logger.warn(`Error while generating random user gif: ${error}`);
					await interaction.editReply({ content: `Beim generieren vom Bild ist ein Fehler aufgetreten. Dein zufälliger Nutzer ist:\n<@${users[Math.floor(Math.random() * users.length)].id}>`, ephemeral: true });
				});
		} else {
			logger.info(`"${interaction.member.user.tag}" did not give enough users to select from when using randomUser.`);
			interaction.editReply({ content: 'Es wurden keine Benutzer zum Auswählen angegeben.', ephemeral: true });
		}
	},
};