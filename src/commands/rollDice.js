// Imports
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger');
const { buildEmbed } = require('../util/embedBuilder');

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
        ? `+${modifier}`
        : modifier < 0
            ? `-${Math.abs(modifier)}`
            : '';
    // Kept looks like this: kh, kl2
    const keptString = kept
        ? `${keptType}${kept.length > 1
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
 * Builds and formats a string representing the details of dice rolls, including rolls,
 * kept values, and results with modifiers.
 *
 * @param {Object} result - The result of a die roll operation.
 * @param {number[]} result.rolls - An array of dice roll values.
 * @param {number[]} [result.kept] - An optional array of kept dice roll values.
 * @param {number} [result.modifier] - An optional modifier to be applied to the calculated result.
 * @return {string} A formatted string containing the details of the dice rolls, kept values,
 * and total result including modifiers.
 */
function buildDiceFieldValue(result) {
    const { rolls, kept, modifier } = result;
    const valuesToSum = kept || rolls;
    const sum = valuesToSum.reduce((a, c) => a + c, 0);

    let valueString = `**${rolls.length === 1 ? 'Wurf' : 'Würfe'}:** ${rolls.join(', ')}`;

    if (kept) {
        valueString += `\n**Gehalten:** ${kept.join(', ')}`;
    }

    if (modifier || valuesToSum.length > 1) {
        // Build the last part of the sum, make sure the operator is correct
        const modifierString = modifier > 0
            ? ` + ${modifier}`
            : modifier < 0
                ? ` - ${Math.abs(modifier)}`
                : '';
        // Operator used for join operation on valuesToSum
        const operator = rolls.length > 1
            ? ' + '
            : '';

        // Put everything together
        valueString += `\n**Ergebnis:** ${valuesToSum.join(operator)}${modifierString} = ${sum + modifier}`;
    }

    return valueString;
}

// Limits, so the result always fits into a single embed and nobody can block the bot with huge rolls
const MAX_PROMPT_LENGTH = 200;
const MAX_GROUPS = 8;
const MAX_DICE = 30;
const MAX_SIDES = 1000;
const MAX_MODIFIER = 9999;

// Rolls dice, which the user can define in the prompt; details are in the rollhelp command
module.exports = {
    guild: true,
    dm: true,
    help: {
        category: 'Zufall',
        usage: '/roll <prompt>',
        examples: '`/roll prompt:3d6kh1` | `/roll prompt:r1d6kl2+3` | `/roll prompt:r1d6kl2+3+r1d6kh1`',
        notes: 'Gibt dir verschiedene Möglichkeiten zu würfeln. Für mehr informationen verwende `/rollhelp`',
    },
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Lässt dich Würfel würfeln')
        .addStringOption(option =>
            option
                .setName('prompt')
                .setDescription('Ein Text, der angibt was gewürfelt werden soll')
                .setMaxLength(MAX_PROMPT_LENGTH)
                .setRequired(true)),
    async execute(interaction) {
        logger.info(`Handling roll command used by "${interaction.user.tag}".`);

        const singleRegex = /(\d*)d(\d+)(kh|kl)?(\d*)?([+-]\d+)?/g;
        const allRegex = /^(r?\d*d\d+(kh|kl)?\d*([+-]\d+)?(\s+|$))+$/g;

        const inputPrompt = interaction.options.getString('prompt');

        if (!inputPrompt.match(allRegex)) {
            await interaction.reply({
                content: 'Bitte überprüfe deine Eingabe. Falls du Hilfe brauchst, verwende bitte `/rollhelp`',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const matchList = [...inputPrompt.matchAll(singleRegex)];

        const tooBig = matchList.length > MAX_GROUPS || matchList.some(match =>
            (match[1] ? parseInt(match[1]) : 1) > MAX_DICE
            || parseInt(match[2]) > MAX_SIDES || parseInt(match[2]) < 1
            || (match[4] ? parseInt(match[4]) : 1) > MAX_DICE
            || Math.abs(match[5] ? parseInt(match[5]) : 0) > MAX_MODIFIER);

        if (tooBig) {
            await interaction.reply({
                content: `Deine Eingabe ist zu groß. Erlaubt sind maximal ${MAX_GROUPS} Würfelgruppen mit je `
                    + `${MAX_DICE} Würfeln, ${MAX_SIDES} Seiten und einem Modifikator bis ${MAX_MODIFIER}.`,
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const results = [];
        for (const match of matchList) {
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

            if (numDice >= 1) {
                results.push({
                    diceType: diceType,
                    rolls: currentDice,
                    keptType: keepType,
                    kept: keptDice,
                    modifier: modifier,
                });
            }
        }

        if (!results || results.length === 0) {
            await interaction.reply({
                content: 'Es konnten leider keine Würfelergebnisse erstellt werden.',
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        logger.debug(`Dice results: [${results.join(', ')}]`, __filename);

        const embed = buildEmbed({
            color: '#0099ff',
            title: 'Würfelergebnisse',
            description: `Du hast \`${inputPrompt}\` gewürfelt.`,
            origin: this.data.name,
            fields: results.map(result => ({
                name: buildDiceFieldName(result),
                value: buildDiceFieldValue(result).slice(0, 1024),
                inline: false,
            })),
        });

        await interaction.reply({ embeds: [embed] });

        logger.info(`Dice were rolled by "${interaction.user.tag}".`);
    },
};

