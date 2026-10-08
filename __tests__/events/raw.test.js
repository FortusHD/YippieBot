// Imports
const { Events, GatewayDispatchEvents } = require('discord.js');
const raw = require('../../src/events/raw');

// Mock
jest.mock('../../src/logging/logger', () => ({
    debug: jest.fn(),
}));

describe('raw', () => {
    // The client is passed to the event by main.js
    const client = {
        riffy: {
            updateVoiceState: jest.fn(),
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should have correct event name', () => {
        // Assert
        expect(raw.name).toBe(Events.Raw);
    });

    describe('VoiceStateUpdate handling', () => {
        test('should process VoiceStateUpdate event', async () => {
            // Arrange
            const mockData = {
                t: GatewayDispatchEvents.VoiceStateUpdate,
                d: { some: 'data' },
            };

            // Act
            await raw.execute(mockData, 0, client);

            // Assert
            expect(client.riffy.updateVoiceState).toHaveBeenCalledWith(mockData);
        });

        test('should process VoiceServerUpdate event', async () => {
            // Arrange
            const mockData = {
                t: GatewayDispatchEvents.VoiceServerUpdate,
                d: { some: 'data' },
            };

            // Act
            await raw.execute(mockData, 0, client);

            // Assert
            expect(client.riffy.updateVoiceState).toHaveBeenCalledWith(mockData);
        });

        test('should not process other event types', async () => {
            // Arrange
            const mockData = {
                t: 'SOME_OTHER_EVENT',
                d: { some: 'data' },
            };

            // Act
            await raw.execute(mockData, 0, client);

            // Assert
            expect(client.riffy.updateVoiceState).not.toHaveBeenCalled();
        });

        test('should handle undefined event type', async () => {
            // Arrange
            const mockData = {
                t: undefined,
                d: { some: 'data' },
            };

            // Act
            await raw.execute(mockData, 0, client);

            // Assert
            expect(client.riffy.updateVoiceState).not.toHaveBeenCalled();
        });
    });
});
