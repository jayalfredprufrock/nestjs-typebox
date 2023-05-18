module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
        'plugin:require-extensions/recommended',
        'plugin:import/recommended',
    ],
    plugins: ['simple-import-sort'],
    rules: {
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        'import/no-unresolved': 'off',
        'import/first': 'error',
        'import/newline-after-import': 'error',
    },
    ignorePatterns: ['dist/*'],
};
