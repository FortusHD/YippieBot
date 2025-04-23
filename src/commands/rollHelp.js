// Imports
const { SlashCommandBuilder } = require('discord.js');
const logger = require('../logging/logger.js');
const { buildEmbed } = require('../util/util');

// Sends a help embed for the roll command
module.exports = {
	guild: true,
	dm: true,
	data: new SlashCommandBuilder()
		.setName('rollhelp')
		.setDescription('Gibt dir Infos über den Würfelbefehl an'),
	async execute(interaction) {
		logger.info(`Handling rollHelp command used by "${interaction.user.tag}".`);

		const embed = buildEmbed({
			color: '#0099ff',
			title: 'Würfel-Hilfe',
			description: 'Hier sind die Optionen für den `/roll` Befehl:',
			origin: this.data.name,
			fields: [
				{
					name: '__Einzelner Würfelwurf__',
					value: '`/roll prompt: rd6`\nWürfelt einen 6-seitigen Würfel.',
					inline: false,
				},
				{
					name: '__Mehrere Würfelwürfe__',
					value: '`/roll prompt: r2d6 r3d8`\nWürfelt zwei 6-seitige Würfel und drei 8-seitige Würfel.',
					inline: false,
				},
				{
					name: '__Modifikator__',
					value: '`/roll prompt: r2d6+3`\nWürfelt zwei 6-seitige Würfel und addiert 3 zum Ergebnis.',
					inline: false,
				},
				{
					name: '__Höchste Würfe behalten (kh)__',
					value: '`/roll prompt: r4d6kh`\nWürfelt vier 6-seitige Würfel und behält den höchsten.',
					inline: false,
				},
				{
					name: '__Niedrigste Würfe behalten (kl)__',
					value: '`/roll prompt: r4d6kl2`\nWürfelt vier 6-seitige Würfel und behält die zwei niedrigsten.',
					inline: false,

				},
				{
					name: '__Kombinationen__',
					value: '`/roll prompt: r4d20kh2+5 r2d4kl`\nKombiniert mehrere Würfelwürfe mit verschiedenen Optionen. Würfelt vier 20-seitige Würfel, behält die zwei höchsten und addiert 5. Würfelt zwei 4-seitige Würfel und behält den niedrigsten.',
					inline: false,
				},
			],

		});

		await interaction.reply({ embeds: [embed] });

		logger.info(`Gave roll help to "${interaction.user.tag}".`);
	},
};