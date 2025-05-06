// Imports
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const logger = require('../logging/logger.js');
const { getRandomColor, buildEmbed } = require('../util/util');

// Chooses a random object from all given objects (separated by commas)
module.exports = {
    guild: true,
    dm: true,
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

        // Check if there are any objects in the list
        if (objects?.length > 0) {
            // TODO: Coole Animation
            const randomObject = objects[Math.floor(Math.random() * objects.length)];
            const randomEmbed = buildEmbed({
                color: getRandomColor(),
                title: 'Das Ergebnis der Ziehung ist...',
                description: `Aus den folgenden Einträgen wurde zufällig ausgewählt:\n${objects.join(', ')}`,
                origin: this.data.name,
                fields: [
                    { name: 'Anzahl Einträge:', value: `${objects.length}`, inline: true },
                    {
                        name: 'Wahrscheinlichkeit:',
                        value: `${Math.round((1 / objects.length) * 100) / 100}%`,
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