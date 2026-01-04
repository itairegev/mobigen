module.exports = {
  extends: ['@mobigen/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Custom rules for this package
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
