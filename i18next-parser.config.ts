import type { UserConfig } from 'i18next-parser';

const config: UserConfig = {
  // Input patterns - scan all TSX/TS files in src
  input: ['src/**/*.{ts,tsx}'],

  // Output settings
  output: 'src/locales/$LOCALE/$NAMESPACE.json',

  // Locales to generate
  locales: ['en', 'te', 'hi'],

  // Default namespace
  defaultNamespace: 'translation',

  // Namespace separator
  namespaceSeparator: ':',

  // Key separator (for nested keys)
  keySeparator: '.',

  // Plural separator
  pluralSeparator: '_',

  // Context separator
  contextSeparator: '_',

  // Default value for extracted keys
  defaultValue: (locale, _namespace, key) => {
    // For English, use the key itself as default
    // For other languages, leave empty to be translated
    if (locale === 'en') {
      return key;
    }
    return '';
  },

  // Lexers for different file types
  lexers: {
    ts: ['JavascriptLexer'],
    tsx: ['JsxLexer'],
    js: ['JavascriptLexer'],
    jsx: ['JsxLexer'],
  },

  // Functions to look for translations
  functions: ['t', 'i18next.t', 'i18n.t'],

  // Trans component support
  transSupportBasicHtmlNodes: true,
  transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'p', 'span'],

  // Don't sort keys (we'll organize manually)
  sort: false,

  // Line ending
  lineEnding: 'lf',

  // Indentation
  indentation: 2,

  // Quote style
  quoteStyle: 'single',

  // Keep removed keys (set to false to clean up unused keys)
  keepRemoved: false,

  // Reset keys to default value on second run
  resetDefaultValueLocale: 'en',

  // Verbose output
  verbose: true,

  // Fail on warnings
  failOnWarnings: false,

  // Custom transform function (optional - for advanced key naming)
  // transform: (file, enc, done) => { ... }
};

export default config;
