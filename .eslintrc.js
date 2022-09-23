module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
    ],
    root: true,
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
    },
    env: {
        node: true,
        jest: true,
    },
    rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
    ignorePatterns: ['dist/*'],
};
