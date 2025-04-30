module.exports = {
    testPathIgnorePatterns: [
        '/node_modules/',
        '/.eslintrc.js',
    ],
    testEnvironment: 'node',
    globals: {
        ReadableStream: require('stream/web').ReadableStream,
        TextEncoder: require('util').TextEncoder,
        TextDecoder: require('util').TextDecoder,
    },
};
