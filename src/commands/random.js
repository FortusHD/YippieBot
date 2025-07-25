// Imports
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const { getRandomColor } = require('../util/util');
const { buildEmbed } = require('../util/embedBuilder');

// Chooses a random object from all given objects (separated by commas)
module.exports = {
    guild: true,
    dm: true,
    help: {
        category: 'Zufall',
        usage: '/random <objects>',
        examples: '`/random objects:Frechheit, Geschichte, Fantasy, Romantik` | '
            + '`/random objects:1,2,3,4,5`',
        notes: 'Es wird ein zufälliges Objekt gewählt. Zudem wird noch die Wahrscheinlichkeit angezeigt.',
    },
    data: new SlashCommandBuilder()
        .setName('random')
        .setDescription('Wählt aus einer Eingabe zufällig einen Eintrag aus')
        .addStringOption(option =>
            option
                .setName('objects')
                .setDescription('Alle möglichen Einträge, aus denen eines zufällig gewählt werden '
					+ 'soll (mit "," getrennt)')
                .setRequired(true)),
    async execute(interaction) {
        logger.info(`Handling random command used by "${interaction.user.tag}".`);
        const objects = interaction.options.getString('objects')?.split(',')?.map(obj => obj.trim());

        logger.debug(`Entered objects: [${objects?.join(', ')}]`, __filename);

        // Check if there are any objects in the list
        if (objects?.length > 0) {
            // TODO: Coole Animation
            const randomObject = objects[Math.floor(Math.random() * objects.length)];
            logger.debug(`Selected object: ${randomObject}`, __filename);
            const randomEmbed = buildEmbed({
                color: getRandomColor(),
                title: 'Das Ergebnis der Ziehung ist...',
                description: `Aus den folgenden Einträgen wurde zufällig ausgewählt:\n${objects.join(', ')}`,
                origin: this.data.name,
                fields: [
                    { name: 'Anzahl Einträge:', value: `${objects.length}`, inline: true },
                    {
                        name: 'Wahrscheinlichkeit:',
                        value: `${Math.round((1 / objects.length) * 100)}%`,
                        inline: true },
                    { name: 'Gewinner:', value: `**${randomObject}**`, inline: false },
                ],
            });

            await interaction.reply({ embeds: [randomEmbed] });
            logger.info(`"${interaction.user.tag}" got "${randomObject}" as a random object.`);
        } else {
            logger.info(`"${interaction.user.tag}" did not give enough objects to select from `
            	+ 'when using random.');
            interaction.reply({
                content: 'Es wurden keine Objekte zum Auswählen angegeben.',
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};