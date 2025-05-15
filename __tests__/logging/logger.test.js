/* eslint no-console: 0*/
// Imports
const fs = require('fs');
const date = require('date-and-time');
const logger = require('../../src/logging/logger');

// Mock
jest.mock('fs');
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'info').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('logger', () => {
    // Setup
    beforeEach(() => {
        jest.clearAllMocks();
        fs.appendFile.mockClear();
    });

    describe('colors object', () => {
        test('should export colors object with correct properties', () => {
            // Assert
            expect(logger.colors).toBeDefined();
            expect(logger.colors.reset).toBe('\x1b[0m');
            expect(logger.colors.fg.red).toBe('\x1b[31m');
            expect(logger.colors.bg.blue).toBe('\x1b[44m');
        });
    });

    describe('log function', () => {
        test('should log message with specified color', () => {
            // Arrange
            const testMessage = 'Test message';
            const testColor = logger.colors.fg.blue;

            // Act
            logger.log(testMessage, testColor);

            // Assert
            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining(testMessage),
            );
            expect(fs.appendFile).toHaveBeenCalled();
        });
    });

    describe('info function', () => {
        test('should log info message with green color', () => {
            // Arrange
            const testMessage = 'Info message';

            // Act
            logger.info(testMessage);

            // Assert
            expect(console.info).toHaveBeenCalledWith(
                expect.stringContaining('[INFO]'),
            );
            expect(console.info).toHaveBeenCalledWith(
                expect.stringContaining(testMessage),
            );
            expect(fs.appendFile).toHaveBeenCalled();
        });
    });

    describe('warn function', () => {
        test('should log warning message with yellow color', () => {
            // Arrange
            const testMessage = 'Warning message';

            // Act
            logger.warn(testMessage);

            // Assert
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('[WARNING]'),
            );
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining(testMessage),
            );
            expect(fs.appendFile).toHaveBeenCalled();
        });
    });

    describe('error function', () => {
        test('should log error message with red color and source', () => {
            // Arrange
            const testMessage = 'Error message';
            const testSource = 'TestSource';

            // Act
            logger.error(testMessage, testSource);

            // Assert
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('[ERROR]'),
            );
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining(testMessage),
            );
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining(testSource),
            );
            expect(fs.appendFile).toHaveBeenCalled();
        });
    });

    describe('file logging', () => {
        test('should create log file with correct path', () => {
            // Arrange
            const testMessage = 'Test message';
            const now = new Date();
            const expectedPath = `./logs/${date.format(now, 'YYYY-MM-DD')}.log`;

            // Act
            logger.info(testMessage);

            // Assert
            expect(fs.appendFile).toHaveBeenCalledWith(
                expectedPath,
                expect.any(String),
                expect.any(Function),
            );
        });

        test('should handle file write errors', () => {
            // Arrange
            const testError = new Error('Write failed');
            fs.appendFile.mockImplementation((path, content, callback) => {
                callback(testError);
            });

            // Act
            logger.info('Test message');

            // Assert
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('[ERROR]'),
            );
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining(testError.toString()),
            );
        });

        test('should do nothing if callback error is null while writing', () => {
            // Arrange
            fs.appendFile.mockImplementation((path, content, callback) => {
                callback(null);
            });

            // Act
            logger.info('Test message');

            // Assert
            expect(console.error).not.toHaveBeenCalledWith(
                expect.stringContaining('[ERROR]'),
            );
        });
    });

    describe('deletion of old log files', () => {
        // Setup
        beforeEach(() => {
            jest.clearAllMocks();

            fs.readdirSync.mockReturnValue([
                'not-a-log.txt',
                '2023-01-01.log',
                '2023-02-01.log',
                `${new Date().toISOString().split('T')[0]}.log`,
            ]);
        });

        test('should delete log files older than 2 months', () => {
            // Act
            logger.deleteOldLogs();

            // Assert
            expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
            expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('2023-01-01.log'));
            expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('2023-02-01.log'));
            expect(console.info).toHaveBeenCalledTimes(2);
            expect(console.info).toHaveBeenCalledWith(expect.stringContaining('2023-01-01.log'));
            expect(console.info).toHaveBeenCalledWith(expect.stringContaining('2023-02-01.log'));
        });

        test('should do nothing if all files are new enough', () => {
            // Arrange
            fs.readdirSync.mockReturnValue([
                'not-a-log.txt',
                `${new Date().toISOString().split('T')[0]}.log`,
            ]);

            // Act
            logger.deleteOldLogs();

            // Assert
            expect(fs.unlinkSync).toHaveBeenCalledTimes(0);
            expect(console.info).toHaveBeenCalledTimes(0);
        });

        test('should handle errors while deleting files', () => {
            // Arrange
            const testError = new Error('Delete failed');
            fs.unlinkSync.mockImplementation(() => {
                throw testError;
            });

            // Act
            logger.deleteOldLogs();

            // Assert
            expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
            expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('2023-01-01.log'));
            expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('2023-02-01.log'));
            expect(console.error).toHaveBeenCalledTimes(2);
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('2023-01-01.log'),
                expect.any(Error),
            );
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('2023-02-01.log'),
                expect.any(Error),
            );
        });
    });
});