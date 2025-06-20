// Imports
const { MessageFlags } = require('discord.js');
const logger = require('../../src/logging/logger');
const { endWichteln } = require('../../src/threads/wichtelLoop');
const { editInteractionReply } = require('../../src/util/util');
const endWichtelnTest = require('../../src/commands/endWichteln');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
}));

jest.mock('../../src/threads/wichtelLoop', () => ({
    endWichteln: jest.fn(),
}));

jest.mock('../../src/util/util', () => ({
    editInteractionReply: jest.fn(),
}));

describe('endWichteln', () => {
    test('should have required properties', () => {
        // Assert
        expect(endWichtelnTest).toHaveProperty('guild', true);
        expect(endWichtelnTest).toHaveProperty('dm', true);
        expect(endWichtelnTest).toHaveProperty('devOnly', true);
        expect(endWichtelnTest).toHaveProperty('help');
        expect(endWichtelnTest.help).toHaveProperty('usage');
        expect(endWichtelnTest).toHaveProperty('data');
        expect(endWichtelnTest.data).toHaveProperty('name', 'endwichteln');
        expect(endWichtelnTest.data).toHaveProperty('description');
        expect(endWichtelnTest.data.contexts).toHaveLength(2);
        expect(endWichtelnTest.data.options).toHaveLength(0);
    });

    describe('execute', () => {
        let mockInteraction;

        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                client: {},
                reply: jest.fn(),
            };

            endWichteln.mockResolvedValue('something');
        });

        test('should end the current wichteln', async () => {
            // Act
            await endWichtelnTest.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling endWichteln command used by "testUser".');
            expect(mockInteraction.reply).toHaveBeenCalledWith({
                content: 'Das wichteln wird beendet...',
                flags: MessageFlags.Ephemeral,
            });
            expect(endWichteln).toHaveBeenCalledWith(mockInteraction.client);
            expect(editInteractionReply).toHaveBeenCalledWith(mockInteraction, expect.any(String));
            expect(logger.info).toHaveBeenCalledWith('"testUser" ended the wichteln.');
        });
    });
});