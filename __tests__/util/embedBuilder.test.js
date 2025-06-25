//Imports
const embedBuilder = require('../../src/util/embedBuilder');
const { Collection } = require('discord.js');

describe('buildEmbed', () => {
    test('builds embed with only required fields', () => {
        // Arrange
        const data = {
            color: 0x000000,
            title: 'Test Title',
            description: 'Test Description',
            origin: 'test',
        };

        // Act
        const embed = embedBuilder.buildEmbed(data);

        // Assert
        expect(embed.data.color).toBe(data.color);
        expect(embed.data.title).toBe(data.title);
        expect(embed.data.description).toBe(data.description);
        expect(embed.data.timestamp).toBeDefined();
        expect(embed.data.footer.text).toBe(`/${data.origin}`);
    });

    test('builds embed with all optional fields', () => {
        // Arrange
        const data = {
            color: 0x000000,
            title: 'Test Title',
            description: 'Test Description',
            fields: [{ name: 'Test Field 1', value: 'Test Value 1' }],
            thumbnail: 'https://test.com/thumbnail.png',
            image: 'https://test.com/image.png',
            footer: { text: 'Test Footer Text', iconURL: 'https://test.com/footer.png' },
            origin: 'test',

        };

        // Act
        const embed = embedBuilder.buildEmbed(data);

        // Assert
        expect(embed.data.color).toBe(data.color);
        expect(embed.data.title).toBe(data.title);
        expect(embed.data.description).toBe(data.description);
        expect(embed.data.fields).toEqual(data.fields);
        expect(embed.data.thumbnail.url).toBe(data.thumbnail);
        expect(embed.data.image.url).toBe(data.image);
        expect(embed.data.timestamp).toBeDefined();
        expect(embed.data.footer.text).toBe(`/${data.origin} ${data.footer.text}`);
        expect(embed.data.footer.icon_url).toBe(data.footer.iconURL);
    });

    test('builds embed with some optional fields', () => {
        // Arrange
        const data = {
            color: 0xffffff,
            title: 'Test Title 2',
            description: 'Test Description 2',
            fields: [{ name: 'Test Field 2', value: 'Test Value 2' }],
            origin: 'test2',
        };

        // Act
        const embed = embedBuilder.buildEmbed(data);

        // Assert
        expect(embed.data.color).toBe(data.color);
        expect(embed.data.title).toBe(data.title);
        expect(embed.data.description).toBe(data.description);
        expect(embed.data.fields).toEqual(data.fields);
        expect(embed.data.thumbnail).toBeUndefined();
        expect(embed.data.image).toBeUndefined();
        expect(embed.data.timestamp).toBeDefined();
        expect(embed.data.footer.text).toBe(`/${data.origin}`);
    });

    test('builds embed with footer text only from origin', () => {
        // Arrange
        const data = {
            color: 0x008000,
            title: 'Test Title 3',
            description: 'Test Description 3',
            footer: { iconURL: 'https://test.com/footer_3.png' },
            origin: 'test3',
        };

        // Act
        const embed = embedBuilder.buildEmbed(data);

        // Assert
        expect(embed.data.footer.text).toBe(`/${data.origin}`);
    });
});

describe('buildWichtelEmbed', () => {
    test('builds embed', () => {
        // Arrange
        const partner = {
            dcName: 'user2',
            id: '2',
            steamFriendCode: 'code2',
            steamName: 'steam2',
        };

        // Act
        const embed = embedBuilder.buildWichtelEmbed(partner, '25.12.2023, 20:00');

        // Assert
        expect(embed.data.color).toBe(0xDB27B7);
        expect(embed.data.title).toBe('Wichtel-Post');
        expect(embed.data.description).toContain(partner.id);
        expect(embed.data.description).toContain(partner.dcName);
        expect(embed.data.description).toContain(partner.steamName);
        expect(embed.data.description).toContain(partner.steamFriendCode);
        expect(embed.data.description).toContain('25.12.2023, 20:00');
        expect(embed.data.fields).toHaveLength(1);
        expect(embed.data.timestamp).toBeDefined();
    });
});

describe('buildRoleEmbed', () => {
    test('builds embed', () => {
        // Arrange
        const color = 0x000000;
        const title = 'Test Title';
        const fields = [
            { name: 'Test Field 1', value: 'Test Value 1' },
            { name: 'Test Field 2', value: 'Test Value 2' },
        ];

        // Act
        const embed = embedBuilder.buildRoleEmbed(color, title, fields);

        // Assert
        expect(embed.data.color).toBe(color);
        expect(embed.data.title).toBe(title);
        expect(embed.data.fields).toEqual(fields);
    });
});

describe('buildErrorEmbed', () => {
    test('builds embed', () => {
        // Arrange
        const errorMessage = 'Some error message';
        const fields = [
            { name: 'Test Field 1', value: 'Test Value 1' },
            { name: 'Test Field 2', value: 'Test Value 2' },
        ];

        // Act
        const embed = embedBuilder.buildErrorEmbed(errorMessage, fields);

        // Assert
        expect(embed.data.color).toBe(0xff0000);
        expect(embed.data.description).toBe(errorMessage);
        expect(embed.data.fields).toEqual(fields);
    });
});

describe('buildAllCommandsEmbed', () => {
    test('builds embed', () => {
        // Arrange
        const commands = new Collection();
        commands.set('test1', {
            help: {
                category: 'Musik',
            },
            data: {
                name: 'test1',
                description: 'Test 1',
            },
        });
        commands.set('test2', {
            help: {
                category: 'Musik',
            },
            data: {
                name: 'test2',
                description: 'Test 2',
            },
        });
        commands.set('test3', {
            help: {
                category: 'Deportation',
            },
            data: {
                name: 'test3',
                description: 'Test 3',
            },
        });
        commands.set('test4', {
            help: {
                category: 'Zufall',
            },
            data: {
                name: 'test4',
                description: 'Test 4',
            },
        });
        commands.set('test5', {
            help: {
                category: 'Hilfe',
            },
            data: {
                name: 'test5',
                description: 'Test 5',
            },
        });
        commands.set('test6', {
            help: {
                category: 'Admin',
            },
            data: {
                name: 'test6',
                description: 'Test 6',
            },
        });
        commands.set('test7', {
            help: {
                category: 'Sonstiges',
            },
            data: {
                name: 'test7',
                description: 'Test 7',
            },
        });

        // Act
        const embed = embedBuilder.buildAllCommandsEmbed(commands);

        // Assert
        expect(embed.data.color).toBe(0x0dec09);
        expect(embed.data.title).toBe('Alle Befehle');
        expect(embed.data.fields).toContainEqual({
            name: '**Musik**',
            value: '- `/test1`: Test 1\n- `/test2`: Test 2',
            inline: false,
        });
        expect(embed.data.fields).toContainEqual({
            name: '**Deportation**',
            value: '- `/test3`: Test 3',
            inline: false,
        });
        expect(embed.data.fields).toContainEqual({
            name: '**Zufall**',
            value: '- `/test4`: Test 4',
            inline: false,
        });
        expect(embed.data.fields).toContainEqual({
            name: '**Hilfe**',
            value: '- `/test5`: Test 5',
            inline: false,
        });
        expect(embed.data.fields).toContainEqual({
            name: '**Admin**',
            value: '- `/test6`: Test 6',
            inline: false,
        });
        expect(embed.data.fields).toContainEqual({
            name: '**Sonstiges**',
            value: '- `/test7`: Test 7',
            inline: false,
        });
    });
});

describe('buildHelpEmbed', () => {
    test('builds basic help embed with minimal command data', () => {
        // Arrange
        const command = {
            data: {
                name: 'test',
                description: 'Test command description',
                data: {
                    options: [],
                },
            },
            help: {
                usage: '`/test`',
            },
        };

        // Act
        const embed = embedBuilder.buildHelpEmbed(command);

        // Assert
        expect(embed.data.color).toBe(0x0dec09);
        expect(embed.data.title).toBe('Hilfe für /test');
        expect(embed.data.description).toBe('Test command description');
        expect(embed.data.footer.text).toBe('/help');
        expect(embed.data.timestamp).toBeDefined();
        expect(embed.data.fields).toContainEqual({
            name: 'Benutzung:',
            value: '`/test`',
        });
        expect(embed.data.fields).toContainEqual({
            name: 'Verfügbarkeit:',
            value: '- Du musst im Voice sein: ❌\n- Server: ✅\n- DM: ✅\n',
        });
    });

    test('builds help embed with all possible properties', () => {
        // Arrange
        const command = {
            data: {
                name: 'fulltest',
                description: 'Full test command',
                options: [
                    {
                        name: 'required_option',
                        description: 'A required option',
                        required: true,
                    },
                    {
                        name: 'optional_option',
                        description: 'An optional option',
                        required: false,
                    },
                ],
            },
            guild: false,
            dm: false,
            vc: true,
            devOnly: true,
            help: {
                usage: '`/fulltest <required_option> [optional_option]`',
                examples: 'Example: `/fulltest required optional`',
                notes: 'Some important notes about usage',
            },
        };

        // Act
        const embed = embedBuilder.buildHelpEmbed(command);

        // Assert
        expect(embed.data.color).toBe(0x0dec09);
        expect(embed.data.title).toBe('Hilfe für /fulltest');
        expect(embed.data.fields).toContainEqual({
            name: 'Benutzung:',
            value: '`/fulltest <required_option> [optional_option]`',
        });
        expect(embed.data.fields).toContainEqual({
            name: 'Beispiel:',
            value: 'Example: `/fulltest required optional`',
        });
        expect(embed.data.fields).toContainEqual({
            name: 'Argumente:',
            value: '**required_option**: A required option - (**Erforderlich**: Ja)\n\n'
                + '**optional_option**: An optional option - (**Erforderlich**: Nein)',
        });
        expect(embed.data.fields).toContainEqual({
            name: 'Berechtigungen:',
            value: '- Admin Only: ✅',
        });
        expect(embed.data.fields).toContainEqual({
            name: 'Verfügbarkeit:',
            value: '- Du musst im Voice sein: ✅\n- Server: ❌\n- DM: ❌\n',
        });
        expect(embed.data.fields).toContainEqual({
            name: 'Hinweise:',
            value: 'Some important notes about usage',
        });
    });

    test('builds help embed without optional fields', () => {
        // Arrange
        const command = {
            data: {
                name: 'simple',
                description: 'Simple command',
                data: {
                    options: [],
                },
            },
            guild: true,
            dm: true,
            vc: false,
            devOnly: false,
            help: {
                usage: '`/simple`',
            },
        };

        // Act
        const embed = embedBuilder.buildHelpEmbed(command);

        // Assert
        expect(embed.data.fields).toHaveLength(2); // Only usage and availability fields
        expect(embed.data.fields).not.toContainEqual(expect.objectContaining({
            name: 'Beispiel:',
        }));
        expect(embed.data.fields).not.toContainEqual(expect.objectContaining({
            name: 'Argumente:',
        }));
        expect(embed.data.fields).not.toContainEqual(expect.objectContaining({
            name: 'Berechtigungen:',
        }));
        expect(embed.data.fields).not.toContainEqual(expect.objectContaining({
            name: 'Hinweise:',
        }));
    });
});