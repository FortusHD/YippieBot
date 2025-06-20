//Imports
const embedBuilder = require('../../src/util/embedBuilder');

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

// TODO: buildAllCommandsEmbed, buildHelpEmbed