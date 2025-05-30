// Imports
const { MessageFlags } = require('discord.js');
const logger = require('../../src/logging/logger');
const data = require('../../src/util/data.js');
const permit = require('../../src/commands/permit.js');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    debug: jest.fn(),
}));

jest.mock('../../src/util/data.js', () => ({
    removePrisoner: jest.fn(),
}));

describe('permit', () => {
    test('should have required properties', () => {
        // Assert
        expect(permit).toHaveProperty('guild', true);
        expect(permit).toHaveProperty('dm', false);
        expect(permit).toHaveProperty('data');
        expect(permit.data).toHaveProperty('name', 'permit');
        expect(permit.data).toHaveProperty('description');
        expect(permit.data.options).toHaveLength(1);
        expect(permit.data.options[0]).toHaveProperty('name', 'user');
        expect(permit.data.options[0]).toHaveProperty('description');
        expect(permit.data.options[0]).toHaveProperty('type', 6);
        expect(permit.data.options[0]).toHaveProperty('required', true);
    });

    describe('execute', () => {
        let mockUser;
        let mockMember;
        let mockGuild;
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockUser = {
                id: '456',
                tag: 'prisonerTag',
            };

            mockMember = {
                id: '456',
            };

            mockGuild = {
                members: {
                    cache: {
                        get: jest.fn().mockReturnValue(mockMember),
                    },
                },
            };

            mockInteraction = {
                user: {
                    tag: 'userTag',
                },
                options: {
                    getUser: jest.fn().mockReturnValue(mockUser),
                },
                guild: mockGuild,
                reply: jest.fn(),
            };
        });

        test('should remove prisoner from list', async () => {
            // Act
            await permit.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling permit command used by "userTag".');
            expect(data.removePrisoner).toHaveBeenCalledWith('456');
            expect(logger.info).toHaveBeenCalledWith('"prisonerTag" was permitted by "userTag".');
            expect(mockInteraction.reply).toHaveBeenCalledWith('prisonerTag wurde repatriiert!');
        });

        test('should handle invalid user', async () => {
            // Arrange
            mockGuild.members.cache.get.mockReturnValue(null);

            // Act
            await permit.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling permit command used by "userTag".');
            expect(logger.info).toHaveBeenCalledWith('"userTag" entered an invalid user.');
            expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({
                content: 'Du hast einen invaliden User angegeben!',
                flags: MessageFlags.Ephemeral,
            }));
            expect(data.removePrisoner).not.toHaveBeenCalled();
        });
    });
});