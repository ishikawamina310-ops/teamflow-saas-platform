module.exports = {
  extends: ['@teamflow/eslint-config/nextjs.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
