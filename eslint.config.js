import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';

export default [
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: parser,
            parserOptions: {
                project: './tsconfig.json', // Specify the TypeScript configuration file
            },
        },
        plugins: {
            '@typescript-eslint': plugin,
        },
        rules: {
            // Menonaktifkan semua aturan terkait 'any'
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-any': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',

            // Aturan tambahan terkait strict type checking
            '@typescript-eslint/no-inferrable-types': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
        },
    },
];