module.exports = {
    root: false,
    env: {
        node: true,
        jest: true,
        es2024: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module'
    },
    rules: {
        'no-console': 'warn',
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        'semi': ['error', 'always'],
        'quotes': ['error', 'single']
    },
    plugins: [
        'jest'
    ],
    overrides: [
        {
            files: [
                '**/*.test.js',
                '**/*.spec.js',
                '__tests__/**/*.js'
            ],
            rules: {
                // Jest-specific rules
                'jest/no-disabled-tests': 'warn',
                'jest/no-focused-tests': 'error',
                'jest/no-identical-title': 'error',
                'jest/prefer-to-have-length': 'warn',
                'jest/valid-expect': 'error',
                // Include base rules to ensure they apply to test files
                'no-console': 'warn',
                'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
                'semi': ['error', 'always'],
                'quotes': ['error', 'single']
            }
        }
    ]
};