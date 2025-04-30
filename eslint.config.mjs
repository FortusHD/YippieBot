import globals from 'globals';
import pluginJs from '@eslint/js';

/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ['**/*.js'], languageOptions: { sourceType: 'commonjs' } },
    { languageOptions: { globals: globals.node } },
    pluginJs.configs.recommended,
    {
        rules: {
            // Possible Errors
            'no-console': ['warn'],
            'no-debugger': ['error'],
            'no-duplicate-case': ['error'],
            'no-empty': ['error'],

            // Best Practices
            'curly': ['error', 'all'],
            'default-case': ['error'],
            'eqeqeq': ['error', 'always'],
            'no-eval': ['error'],
            'no-multi-spaces': ['error'],
            'no-return-await': ['error'],
            'no-unused-expressions': ['error'],

            // Variables
            'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
            'no-use-before-define': ['error'],

            // Stylistic Issues
            'array-bracket-spacing': ['error', 'never'],
            'block-spacing': ['error', 'always'],
            'brace-style': ['error', '1tbs'],
            'camelcase': ['error'],
            'comma-dangle': ['error', 'always-multiline'],
            'comma-spacing': ['error', { 'before': false, 'after': true }],
            'indent': ['error', 4],
            'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
            'keyword-spacing': ['error', { 'before': true, 'after': true }],
            'max-len': ['warn', { 'code': 120 }],
            'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 1 }],
            'no-trailing-spaces': ['error'],
            'object-curly-spacing': ['error', 'always'],
            'quotes': ['error', 'single'],
            'semi': ['error', 'always'],
            'semi-spacing': ['error', { 'before': false, 'after': true }],
            'space-before-blocks': ['error', 'always'],
            'space-before-function-paren': ['error', {
                'anonymous': 'always',
                'named': 'never',
                'asyncArrow': 'always',
            }],
            'space-in-parens': ['error', 'never'],
            'space-infix-ops': ['error'],

            // ES6
            'arrow-spacing': ['error', { 'before': true, 'after': true }],
            'no-var': ['error'],
            'prefer-const': ['error'],
            'prefer-template': ['warn'],
        },
    },
];
