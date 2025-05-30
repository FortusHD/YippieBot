/**
 * Tests for the logger module
 *
 * @group logging
 * @group common
 */

/* eslint no-console: 0*/

// Imports
const fs = require('fs');
const logger = require('../../src/logging/logger');

// Mock dependencies
jest.mock('fs');

/**
 * Sets up the mock environment for logger tests
 * Mocks console methods and fs module
 */
const setupMockEnvironment = () => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    jest.mock('fs');
    fs.appendFile.mockClear();
};

describe('logger', () => {
    beforeEach(() => {
        setupMockEnvironment();
    });

    describe('colors object', () => {
        test('should define correct color properties', () => {
            expect(logger.colors).toMatchObject({
                reset: '\x1b[0m',
                fg: { red: '\x1b[31m' },
                bg: { blue: '\x1b[44m' },
            });
        });
    });

    describe('log function', () => {
        test('should log message with specified color', () => {
            const testMessage = 'Test message';
            const testColor = logger.colors.fg.blue;

            logger.log(testMessage, testColor);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining(testMessage));
            expect(fs.appendFile).toHaveBeenCalled();
        });
    });

    describe('file logging', () => {
        // Define test cases as objects for better readability
        const testCases = [
            {
                message: 'Test message',
                error: null,
                expectedConsoleCalls: 0,
                description: 'handles successful file writes',
            },
            {
                message: 'Test message',
                error: new Error('Write failed'),
                expectedConsoleCalls: 1,
                description: 'handles file write errors',
            },
        ];

        test.each(testCases)(
            '$description',
            ({ message, error, expectedConsoleCalls }) => {
                // Arrange
                fs.appendFile.mockImplementation((_, __, callback) => callback(error));

                // Act
                logger.info(message);

                // Assert
                if (error) {
                    expect(console.error).toHaveBeenCalled();
                } else {
                    expect(console.error).not.toHaveBeenCalled();
                }

                expect(console.error).toHaveBeenCalledTimes(expectedConsoleCalls);
            },
        );
    });

    describe('deletion of old log files', () => {
        const mockFiles = [
            'not-a-log.txt',
            '2023-01-01.log',
            '2023-02-01.log',
            `${new Date().toISOString().split('T')[0]}.log`,
        ];

        beforeEach(() => {
            fs.readdirSync.mockReturnValue(mockFiles);
        });

        test('should delete old log files', () => {
            logger.deleteOldLogs();

            expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('2023-01-01.log'));
            expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('2023-02-01.log'));
        });

        test('should skip deletion for recent files', () => {
            fs.readdirSync.mockReturnValue([`${new Date().toISOString().split('T')[0]}.log`]);

            logger.deleteOldLogs();

            expect(fs.unlinkSync).not.toHaveBeenCalled();
        });

        test('should handle errors during deletion', () => {
            const error = new Error('Delete failed');
            fs.unlinkSync.mockImplementation(() => {
                throw error;
            });

            logger.deleteOldLogs();

            expect(console.error).toHaveBeenCalledWith(expect.stringContaining('2023-01-01.log'), error);
        });
    });

    describe('log level tests', () => {
        // Setup constants
        const originalEnv = process.env;
        const testMessage = 'Test message';
        const source = 'testSource';

        /**
         * Helper function to load logger with specific log level
         */
        const loadLoggerForLevel = (level) => {
            jest.resetModules();
            delete require.cache[require.resolve('../../src/logging/logger')];
            process.env = { ...originalEnv, LOG_LEVEL: level };
            return require('../../src/logging/logger');
        };

        // Setup and cleanup
        beforeEach(() => {
            jest.clearAllMocks();
            process.env = { ...originalEnv };
        });

        afterAll(() => {
            process.env = originalEnv;
        });

        // Define test cases as objects for better readability
        const logLevelTestCases = [
            {
                level: 'debug',
                description: 'with debug level shows all log levels',
                methods: [
                    { method: 'debug', color: '\x1b[90m', prefix: '[DEBUG]' },
                    { method: 'info', color: '\x1b[32m', prefix: '[INFO]' },
                    { method: 'warn', color: '\x1b[33m', prefix: '[WARNING]' },
                    { method: 'error', color: '\x1b[31m', prefix: '[ERROR]' },
                ],
                lowerMethods: [],
            },
            {
                level: 'info',
                description: 'with info level hides debug logs',
                methods: [
                    { method: 'info', color: '\x1b[32m', prefix: '[INFO]' },
                    { method: 'warn', color: '\x1b[33m', prefix: '[WARNING]' },
                    { method: 'error', color: '\x1b[31m', prefix: '[ERROR]' },
                ],
                lowerMethods: ['debug'],
            },
            {
                level: 'warn',
                description: 'with warn level hides debug and info logs',
                methods: [
                    { method: 'warn', color: '\x1b[33m', prefix: '[WARNING]' },
                    { method: 'error', color: '\x1b[31m', prefix: '[ERROR]' },
                ],
                lowerMethods: ['debug', 'info'],
            },
            {
                level: 'error',
                description: 'with error level only shows error logs',
                methods: [
                    { method: 'error', color: '\x1b[31m', prefix: '[ERROR]' },
                ],
                lowerMethods: ['debug', 'info', 'warn'],
            },
        ];

        test.each(logLevelTestCases)(
            '$description (LOG_LEVEL=$level)',
            ({ level, methods, lowerMethods }) => {
                // Arrange
                const logger = loadLoggerForLevel(level);

                // Test methods that should be active
                methods.forEach(({ method, color, prefix }) => {
                    // Arrange
                    const loggerMethod = logger[method];
                    const consoleMethod = console[method];

                    // Act
                    if (method === 'debug' || method === 'error') {
                        loggerMethod(testMessage, source);
                    } else {
                        loggerMethod(testMessage);
                    }

                    // Assert
                    expect(consoleMethod).toHaveBeenCalledWith(expect.stringContaining(color));
                    expect(consoleMethod).toHaveBeenCalledWith(expect.stringContaining(prefix));
                    expect(consoleMethod).toHaveBeenCalledWith(expect.stringContaining(testMessage));
                    if (method === 'debug' || method === 'error') {
                        expect(consoleMethod).toHaveBeenCalledWith(expect.stringContaining(source));
                    }
                });

                // Test methods that should be inactive
                lowerMethods.forEach((method) => {
                    // Arrange
                    const loggerMethod = logger[method];
                    const consoleMethod = console[method];

                    // Act
                    loggerMethod(testMessage);

                    // Assert
                    expect(consoleMethod).not.toHaveBeenCalled();
                });
            },
        );
    });
});
