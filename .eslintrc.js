module.exports = {
  extends: ['expo'],
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  rules: {
    'react/prop-types': 'off',
    'react/no-unescaped-entities': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
  },
};
