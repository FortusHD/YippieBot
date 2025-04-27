// Imports
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const { buildEmbed } = require('../util/util');

// Rolls dice, which the user can define in the prompt; details are in the rollhelp command
module.exports = {
	guild: true,
	dm: true,
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Lässt dich einen Würfel würfeln')
		.addStringOption(option =>
			option
				.setName('prompt')
				.setDescription('Ein Text, der angibt was gewürfelt werden soll')
				.setRequired(true)),
	async execute(interaction) {
		logger.info(`Handling roll command used by "${interaction.user.tag}".`);

		const singleRegex = /(\d*)d(\d+)(kh|kl)?(\d*)?([+-]\d+)?/g;
		const allRegex = /^(r?\d*d\d+(kh|kl)?\d*([+-]\d+)?(\s+|$))+$/g;

		const inputPrompt = interaction.options.getString('prompt');

		if (!inputPrompt.match(allRegex)) {
			await interaction.reply({
				content: 'Bitte überprüfe deine Eingabe. Falls du Hilfe brauchst, verwende bitte `/rollhelp`',
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		const matches = inputPrompt.matchAll(singleRegex);
		if (!matches || matches.length === 0) {
			await interaction.reply({
				content: 'Es konnten leider keine Anfragen aus deiner Eingabe gebaut werden.',
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		const results = [];
		for (const match of matches) {
			const numDice = match[1] ? parseInt(match[1]) : 1;
			const diceType = parseInt(match[2]);
			const keepType = match[3];
			const keepCount = match[4] ? parseInt(match[4]) : 1;
			const modifier = match[5] ? parseInt(match[5]) : 0;

			const currentDice = [];
			for (let i = 0; i < numDice; i++) {
				currentDice.push(Math.floor(Math.random() * diceType) + 1);
			}

			let keptDice = [...currentDice];
			if (keepType) {
				if (keepType === 'kh') {
					keptDice = keptDice.sort((a, b) => b - a).slice(0, keepCount);
				} else { // keepType === 'kl'
					keptDice = keptDice.sort((a, b) => a - b).slice(0, keepCount);
				}
			} else {
				keptDice = null;
			}

			results.push({
				diceType: diceType,
				rolls: currentDice,
				keptType: keepType,
				kept: keptDice,
				modifier: modifier
			});
		}

		if (!results || results.length === 0) {
			await interaction.reply({
				content: 'Es konnten leider keine Würfelergebnisse erstellt werden.',
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		const embed = buildEmbed({
			color: '#0099ff',
			title: 'Würfelergebnisse',
			description: `Du hast \`${inputPrompt}\` gewürfelt.`,
			origin: this.data.name,
			fields: results.map(result => ({
				name: buildDiceFieldName(result),
				value: buildDiceFieldValue(result),
				inline: false
			}))
		});

		await interaction.reply({ embeds: [embed] });

		logger.info(`Dice were rolled by "${interaction.user.tag}".`);
	},
};

/**
 * Builds a formatted string representing the field name for a die roll result, detailing the dice type,
 * number of rolls, any kept rolls, and any modifiers.
 *
 * @param {Object} result - An object containing properties of the dice roll result.
 * @param {Array} result.rolls - An array containing the individual dice roll values.
 * @param {number} result.diceType - The type of dice rolled, e.g., 6 for a D6.
 * @param {string} [result.keptType] - The type of kept rolls, such as "highest" or "lowest".
 * @param {Array} [result.kept] - An array of kept roll values, if applicable.
 * @param {number} [result.modifier] - A numerical modifier applied to the roll result.
 * @return {string} A formatted string representing the dice roll configuration and results.
 */
function buildDiceFieldName(result) {
	const { rolls, diceType, keptType, kept, modifier } = result;
	let nameString = `__${rolls.length} × D${diceType}__`;

	// Modifier looks like this: +3, -12
	const modifierString = modifier > 0
		? `+ ${modifier}`
		: modifier < 0
			? `- ${Math.abs(modifier)}`
			: '';
	// Kept looks like this: kh, kl2
	const keptString = kept
		? ` ${keptType}${kept.length > 1 
			? `${kept.length}` 
			: ''}`
		: '';
	// Put everything together
	const modifierAndKeptString = kept && modifier
		? ` (${keptString} | ${modifierString})`
		: kept
			? ` (${keptString})`
			: modifier
				? ` (${modifierString})`
				: '';


	nameString += modifierAndKeptString;
	return nameString;
}

/**
 * Builds and formats a string representing the details of dice rolls, including rolls, kept values, and results with modifiers.
 *
 * @param {Object} result - The result of a die roll operation.
 * @param {number[]} result.rolls - An array of dice roll values.
 * @param {number[]} [result.kept] - An optional array of kept dice roll values.
 * @param {number} [result.modifier] - An optional modifier to be applied to the calculated result.
 * @return {string} A formatted string containing the details of the dice rolls, kept values, and total result including modifiers.
 */
function buildDiceFieldValue(result) {
	const { rolls, kept, modifier } = result;
	const valuesToSum = kept || rolls;
	const sum = valuesToSum.reduce((a, c) => a + c, 0);

	let valueString = `**${rolls.length === 1 ? 'Würfe' : 'Wurf'}:** ${rolls.join(', ')}`;

	if (kept) {
		valueString += `\n**Gehalten:** ${kept.join(', ')}`;
	}

	if (modifier || valuesToSum.length > 1) {
		// Build the last part of the sum, make sure the operator is correct
		const modifierString = modifier > 0
			? `+ ${modifier}`
			: modifier < 0
				? `- ${Math.abs(modifier)}`
				: '';
		// Operator used for join operation on valuesToSum
		const operator = rolls.length > 1
			? ' + '
			: '';

		// Put everything together
		valueString += `\n**Ergebnis:** ${valuesToSum.join(operator)} ${modifierString} = ${sum + modifier}`;
	}

	return valueString;
}