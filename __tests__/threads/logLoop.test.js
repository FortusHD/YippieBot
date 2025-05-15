// Imports
const logger = require('../../src/logging/logger');
const { startLogLoop } = require('../../src/threads/logLoop');

// Mock
jest.mock('../../src/logging/logger', () => ({
    info: jest.fn(),
    deleteOldLogs: jest.fn(),
}));

describe('logLoop', () => {
    let mockSetInterval;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        mockSetInterval = jest.spyOn(global, 'setInterval').mockImplementation((cb) => {
            mockSetInterval.mockCallback = cb;
            return 123;
        });
    });

    afterEach(() => {
        mockSetInterval.mockRestore();
    });

    test('startLogLoop initializes', async () => {
        // Act
        await startLogLoop();

        // Assert
        expect(logger.info).toHaveBeenCalledWith('Starting "logLoop"');
        expect(logger.info).toHaveBeenCalledWith('Deleting old logs...');
        expect(logger.deleteOldLogs).toHaveBeenCalled();
    });

    test('should run each day', async () => {
        // Act
        await startLogLoop();
        mockSetInterval.mockCallback();

        // Assert
        expect(logger.info).toHaveBeenCalledWith('Deleting old logs...');
        expect(logger.deleteOldLogs).toHaveBeenCalledTimes(2);
    });
});