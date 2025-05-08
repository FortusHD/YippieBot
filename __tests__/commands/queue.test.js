// Imports
const logger = require('../../src/logging/logger');
const { buildQueueEmbed } = require('../../src/util/queueEmbedManager');
const queue = require('../../src/commands/queue');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
}));

jest.mock('../../src/util/queueEmbedManager', () => ({
    buildQueueEmbed: jest.fn(),
}));

describe('queue', () => {
    test('should have required properties', () => {
        expect(queue).toHaveProperty('guild', true);
        expect(queue).toHaveProperty('dm', false);
        expect(queue).toHaveProperty('player', true);
        expect(queue).toHaveProperty('data');
        expect(queue.data).toHaveProperty('name', 'queue');
        expect(queue.data).toHaveProperty('description');
        expect(queue.data.options).toHaveLength(1);
        expect(queue.data.options[0]).toHaveProperty('name', 'page');
        expect(queue.data.options[0]).toHaveProperty('description');
        expect(queue.data.options[0]).toHaveProperty('type', 4);
        expect(queue.data.options[0]).toHaveProperty('required', false);
    });

    describe('execute', () => {
        const testData = [1, 10, null];

        test.each(testData)('should handle queue page %s', async (page) => {
            // Arrange
            const mockInteraction = {
                user: {
                    tag: 'testUser',
                },
                options: {
                    getInteger: jest.fn().mockReturnValue(page),
                },
            };

            // Act
            await queue.execute(mockInteraction);

            // Assert
            expect(logger.info).toHaveBeenCalledWith('Handling queue command used by "testUser".');
            expect(buildQueueEmbed).toHaveBeenCalledWith(mockInteraction, page);
        });
    });
});