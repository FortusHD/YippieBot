// Imports
const logger = require('../../../src/logging/logger');
const nodeConnect = require('../../../src/riffy/node/nodeConnect');

jest.mock('../../../src/logging/logger', () => ({
    info: jest.fn(),
}));

describe('nodeConnectListener', () => {
    let mockNode;

    // Setup
    beforeEach(() => {
        jest.clearAllMocks();

        mockNode = {
            name: 'localhost',
        };
    });

    test('should have required properties', () => {
        // Assert
        expect(nodeConnect).toHaveProperty('name', 'nodeConnect');
        expect(nodeConnect).toHaveProperty('execute');
        expect(typeof nodeConnect.execute).toBe('function');
    });

    test('execute function handles node connect event correctly', async () => {
        // Act
        await nodeConnect.execute(mockNode);

        // Assert
        expect(logger.info).toHaveBeenCalledWith(`[RIFFY] Node ${mockNode.name} has connected.`);
    });
});