module.exports = {
  parserOptions: {
    ecmaVersion: 8,
  },
  extends: 'standard',
  plugins: ['standard', 'promise', 'node', 'prettier'],
  env: {
    node: true,
    mocha: true,
    browser: true,
  },
  rules: {
    'comma-dangle': ['error', 'always-multiline'],
    indent: [
      'error',
      2,
      {
        SwitchCase: 1,
      },
    ],
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'always',
        named: 'ignore',
        asyncArrow: 'always',
      },
    ],
  },
}
