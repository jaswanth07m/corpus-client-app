/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Subject case
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],

    // Subject full stop
    'subject-full-stop': [2, 'never', ['.']],

    // Subject max length
    'subject-max-length': [2, 'always', 72],

    // Type enum - conventional commit types
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, semicolons, etc.)
        'refactor', // Code refactoring (not a feature or fix)
        'test', // Adding or updating tests
        'build', // Build system or external dependencies
        'ci', // CI configuration changes
        'chore', // Other changes that don't modify src/test files
        'revert', // Reverting a previous commit
      ],
    ],

    // Type case
    'type-case': [2, 'always', 'lower-case'],

    // Type empty
    'type-empty': [2, 'never'],

    // Type max length
    'type-max-length': [2, 'always', 10],

    // Body max line length
    'body-max-line-length': [2, 'always', 100],

    // Footer max line length
    'footer-max-line-length': [2, 'always', 100],

    // Header max length
    'header-max-length': [2, 'always', 100],
  },
};
