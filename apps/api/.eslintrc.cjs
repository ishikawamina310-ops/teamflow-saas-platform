module.exports = {
  extends: ['@teamflow/eslint-config/nestjs.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
