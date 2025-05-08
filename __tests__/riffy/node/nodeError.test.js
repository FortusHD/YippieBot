// Imports
const logger = require('../../../src/logging/logger');
const nodeError = require('../../../src/riffy/node/nodeError');

jest.mock('../../../src/logging/logger', () => ({
    warn: jest.fn(),
}));

describe('nodeErrorListener', () => {
    let mockNode;
    let mockError;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        mockNode = {
            name: 'localhost',
        };

        mockError = {
            message: 'Test Error',
        };
    });

    test('should have required properties', () => {
        // Assert
        expect(nodeError).toHaveProperty('name', 'nodeError');
        expect(nodeError).toHaveProperty('execute');
        expect(typeof nodeError.execute).toBe('function');
    });

    test('execute function handles node connect event correctly', async () => {
        // Act
        await nodeError.execute(mockNode, mockError);

        // Assert
        expect(logger.warn).toHaveBeenCalledWith(`[RIFFY] Node ${mockNode.name} encountered an error: `
            + `${mockError.message}`);
    });
});