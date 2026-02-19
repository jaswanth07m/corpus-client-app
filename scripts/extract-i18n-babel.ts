#!/usr/bin/env node

/**
 * i18n String Extractor using Babel AST Parser
 *
 * This script scans React components for hardcoded strings using proper AST parsing:
 * 1. Extracts them to translation JSON files
 * 2. Replaces them with t() function calls
 *
 * Usage:
 *   bun run scripts/extract-i18n-babel.ts          # Dry run (preview changes)
 *   bun run scripts/extract-i18n-babel.ts --write  # Apply changes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as babelParser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const LOCALES_DIR = path.join(SRC_DIR, 'locales');

// Strings to ignore (common non-UI text)
const IGNORE_PATTERNS: RegExp[] = [
  /^\d+$/, // Pure numbers
  /^[a-z_][a-z0-9_]*$/, // snake_case identifiers
  /^[A-Z_][A-Z0-9_]*$/, // CONSTANT_CASE
  /^[a-zA-Z][a-zA-Z0-9]*$/, // camelCase/PascalCase (likely variables)
  /^https?:\/\//, // URLs
  /^data:/, // Data URIs
  /^#/, // Hex colors or anchors
  /^\./, // File extensions
  /@/, // Email addresses or imports
  /^[0-9a-f]{6,}$/i, // Long hex strings (IDs, hashes)
  /^[\d\s\-+/()]+$|^[\d\s×÷+-()]+$/, // Math expressions
  /^&[a-z]+;$/, // HTML entities
  /^[{}[\],;:=<>!&|?]+$/, // Operators/punctuation only
  /^\s*$/, // Empty or whitespace only
  /React\./, // React patterns
  /use[A-Z]/, // React hooks
  /RefObject|MutableRefObject|ForwardRef/, // React types
  /=>|===|!==|==|!=|<=|>=/, // Code operators
  /^\[?\d+\.?\d*,?\s*\d+\.?\d*\]?$/, // Coordinates
  /displayName|forwardRef|ComponentProps/, // React internals
];

// JSX attributes that commonly contain user-visible text
const TEXT_ATTRIBUTES = [
  'placeholder',
  'label',
  'title',
  'alt',
  'aria-label',
  'value',
  'defaultValue',
];

// Categories for organizing keys
const KEY_CATEGORIES: Record<string, string[]> = {
  common: [
    'submit',
    'cancel',
    'save',
    'delete',
    'edit',
    'add',
    'remove',
    'ok',
    'yes',
    'no',
    'confirm',
    'back',
    'next',
    'previous',
    'loading',
    'error',
    'success',
    'search',
    'filter',
    'sort',
    'close',
    'open',
    'view',
    'hide',
    'show',
    'more',
    'less',
    'upload',
    'download',
    'import',
    'export',
    'refresh',
    'retry',
    'select',
    'deselect',
    'clear',
    'reset',
    'apply',
    'done',
  ],
  nav: [
    'home',
    'profile',
    'settings',
    'logout',
    'login',
    'signup',
    'dashboard',
    'account',
    'help',
    'about',
    'contact',
  ],
  auth: [
    'email',
    'password',
    'username',
    'phone',
    'otp',
    'forgot password',
    'reset password',
    'sign in',
    'sign up',
  ],
  media: [
    'photo',
    'video',
    'audio',
    'image',
    'file',
    'document',
    'camera',
    'microphone',
    'gallery',
    'record',
  ],
  user: [
    'name',
    'full name',
    'first name',
    'last name',
    'bio',
    'location',
    'address',
    'city',
    'state',
    'country',
  ],
  messages: [
    'are you sure',
    'cannot be undone',
    'success',
    'error',
    'no data',
    'no results',
    'not found',
    'loading',
    'try again',
    'something went wrong',
  ],
  validation: [
    'required',
    'invalid',
    'too short',
    'too long',
    'must be',
    'should be',
    'please enter',
  ],
  time: [
    'today',
    'yesterday',
    'tomorrow',
    'now',
    'minute',
    'hour',
    'day',
    'week',
    'month',
    'year',
  ],
  stats: [
    'total',
    'count',
    'average',
    'points',
    'score',
    'contributions',
    'uploads',
    'reviews',
  ],
  categories: [
    'category',
    'type',
    'tag',
    'label',
    'status',
    'public',
    'private',
    'draft',
    'published',
  ],
};

// Build category lookup
const CATEGORY_LOOKUP: Record<string, string> = {};
Object.entries(KEY_CATEGORIES).forEach(([category, keywords]) => {
  keywords.forEach((keyword) => {
    CATEGORY_LOOKUP[keyword.toLowerCase()] = category;
  });
});

// Types
interface ExtractedString {
  type: 'jsx-text' | 'attribute' | 'toast' | 'call-expression';
  attribute?: string;
  toastType?: string;
  original: string;
  key: string;
  start: number;
  end: number;
  nodeType: string;
}

interface StringInfo {
  original: string;
  key: string;
  count: number;
  files: string[];
  type: string;
}

interface Replacement {
  type: string;
  from: string;
  to: string;
  key: string;
}

interface FileChange {
  file: string;
  originalContent: string;
  newContent: string;
  replacements: Replacement[];
}

// Stats
const stats = {
  filesScanned: 0,
  stringsFound: 0,
  stringsReplaced: 0,
  filesModified: 0,
  errors: [] as string[],
};

/**
 * Check if a string should be ignored
 */
function shouldIgnore(str: string): boolean {
  const trimmed = str.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length > 200) return true;

  return IGNORE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Generate a translation key from a string
 */
function generateKey(text: string): string {
  const normalized = text.toLowerCase().trim();

  // Check if it matches a known category
  for (const [keyword, category] of Object.entries(CATEGORY_LOOKUP)) {
    if (normalized.includes(keyword)) {
      const key = normalized
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .map((word, i) =>
          i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join('');
      return `${category}.${key}`;
    }
  }

  // Default: create key from text
  const key = normalized
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .join('.');

  if (key.length <= 20) {
    return `common.${key}`;
  }

  return `ui.${key}`;
}

/**
 * Parse file content and extract strings using Babel AST
 */
function extractStringsFromAST(
  content: string,
  filePath: string,
): ExtractedString[] {
  const strings: ExtractedString[] = [];

  let ast: t.File;
  try {
    ast = babelParser.parse(content, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'classProperties',
        'nullishCoalescingOperator',
        'optionalChaining',
        'bigInt',
      ],
    });
  } catch (error) {
    console.warn(
      `⚠️  Failed to parse ${filePath}: ${(error as Error).message}`,
    );
    return strings;
  }

  traverse(ast, {
    // JSX Text nodes: <div>Hello</div>
    JSXText(path) {
      const text = path.node.value.trim();
      if (text && !shouldIgnore(text)) {
        strings.push({
          type: 'jsx-text',
          original: text,
          key: generateKey(text),
          start: path.node.start!,
          end: path.node.end!,
          nodeType: 'JSXText',
        });
      }
    },

    // JSX Attributes with string values: placeholder="Enter email"
    JSXAttribute(path) {
      const attrName = path.node.name.name;
      if (
        typeof attrName === 'string' &&
        TEXT_ATTRIBUTES.includes(attrName) &&
        t.isStringLiteral(path.node.value)
      ) {
        const text = path.node.value.value;
        if (!shouldIgnore(text)) {
          strings.push({
            type: 'attribute',
            attribute: attrName,
            original: text,
            key: generateKey(text),
            start: path.node.value.start!,
            end: path.node.value.end!,
            nodeType: 'JSXAttribute',
          });
        }
      }
    },

    // Call expressions: toast.success("Message")
    CallExpression(path) {
      const callee = path.node.callee;

      // Check for toast.success/error/info/warning
      if (
        t.isMemberExpression(callee) &&
        t.isIdentifier(callee.object, { name: 'toast' }) &&
        t.isIdentifier(callee.property) &&
        ['success', 'error', 'info', 'warning'].includes(callee.property.name)
      ) {
        const firstArg = path.node.arguments[0];
        if (t.isStringLiteral(firstArg)) {
          const text = firstArg.value;
          if (!shouldIgnore(text)) {
            strings.push({
              type: 'toast',
              toastType: callee.property.name,
              original: text,
              key: generateKey(text),
              start: firstArg.start!,
              end: firstArg.end!,
              nodeType: 'CallExpression',
            });
          }
        }
      }
    },
  });

  return strings;
}

/**
 * Replace strings in content with t() calls
 */
function replaceStrings(
  content: string,
  strings: ExtractedString[],
): { newContent: string; replacements: Replacement[] } {
  // Sort by position descending to replace from end to start
  const sortedStrings = [...strings].sort((a, b) => b.start - a.start);
  let newContent = content;
  const replacements: Replacement[] = [];

  for (const str of sortedStrings) {
    const originalText = content.slice(str.start, str.end);

    let replacement: string;
    let searchStr: string;

    if (str.type === 'jsx-text') {
      // Replace text node with {t('key')}
      searchStr = originalText;
      replacement = `{t('${str.key}')}`;
    } else if (str.type === 'attribute') {
      // Replace attr="value" with attr={t('key')}
      searchStr = originalText;
      replacement = `{t('${str.key}')}`;
    } else if (str.type === 'toast') {
      // Replace string argument in toast call
      searchStr = originalText;
      replacement = `t('${str.key}')`;
    } else {
      continue;
    }

    // Check if already replaced
    if (!newContent.includes(replacement)) {
      const before = newContent;
      newContent = newContent.replace(searchStr, replacement);
      if (newContent !== before) {
        replacements.push({
          type: str.type,
          from: searchStr,
          to: replacement,
          key: str.key,
        });
      }
    }
  }

  return { newContent, replacements };
}

/**
 * Load translation JSON file
 */
function loadTranslations(locale: string): Record<string, unknown> {
  const filePath = path.join(LOCALES_DIR, locale, 'translation.json');
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (_error) {
    return {};
  }
}

/**
 * Save translation JSON file
 */
function saveTranslations(
  locale: string,
  translations: Record<string, unknown>,
) {
  const filePath = path.join(LOCALES_DIR, locale, 'translation.json');
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    filePath,
    JSON.stringify(translations, null, 2) + '\n',
    'utf-8',
  );
}

/**
 * Set nested value in object by dot-notation key
 */
function setNestedValue(
  obj: Record<string, unknown>,
  key: string,
  value: string,
) {
  const parts = key.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

/**
 * Get all existing keys from translations
 */
function getAllKeys(
  translations: Record<string, unknown>,
  prefix = '',
): string[] {
  let keys: string[] = [];

  for (const [key, value] of Object.entries(translations)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Find all TSX/TS files
 */
function findFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
        continue;
      }
      files.push(...findFiles(fullPath));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))
    ) {
      if (
        entry.name.includes('.test.') ||
        entry.name.includes('.spec.') ||
        entry.name === 'vite-env.d.ts'
      ) {
        continue;
      }
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const writeMode = args.includes('--write');
  const dryRun = !writeMode;

  console.log('🌍 i18n String Extractor (Babel AST)');
  console.log('====================================\n');
  console.log(
    `Mode: ${dryRun ? '👀 DRY RUN (no changes will be made)' : '✏️  WRITING CHANGES'}\n`,
  );

  // Load existing translations
  const locales = ['en', 'te', 'hi'];
  const translations: Record<string, Record<string, unknown>> = {};

  locales.forEach((locale) => {
    translations[locale] = loadTranslations(locale);
  });

  // Find all TSX/TS files
  const files = findFiles(SRC_DIR);

  console.log(`📁 Found ${files.length} files to scan\n`);

  // Process each file
  const allStrings = new Map<string, StringInfo>();
  const fileChanges: FileChange[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const strings = extractStringsFromAST(content, file);

    if (strings.length > 0) {
      stats.filesScanned++;
      stats.stringsFound += strings.length;

      // Track unique strings
      strings.forEach((str) => {
        if (!allStrings.has(str.key)) {
          allStrings.set(str.key, {
            original: str.original,
            key: str.key,
            count: 0,
            files: [],
            type: str.type,
          });
        }
        const existing = allStrings.get(str.key)!;
        existing.count++;
        if (!existing.files.includes(file)) {
          existing.files.push(file);
        }
      });

      // Generate replacements
      const { newContent, replacements } = replaceStrings(content, strings);

      if (replacements.length > 0) {
        stats.stringsReplaced += replacements.length;
        fileChanges.push({
          file,
          originalContent: content,
          newContent,
          replacements,
        });
      }
    }
  }

  // Report findings
  console.log('📊 Statistics:');
  console.log(`   Files scanned: ${stats.filesScanned}`);
  console.log(`   Strings found: ${stats.stringsFound}`);
  console.log(`   Unique keys: ${allStrings.size}`);
  console.log(`   Replacements to make: ${stats.stringsReplaced}`);
  console.log(`   Files to modify: ${fileChanges.length}\n`);

  // Show unique strings to be added
  if (allStrings.size > 0) {
    console.log('📝 Unique translation keys to add:\n');

    // Group by category
    const byCategory: Record<string, StringInfo[]> = {};
    allStrings.forEach((info, key) => {
      const category = key.split('.')[0];
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(info);
    });

    for (const [category, items] of Object.entries(byCategory)) {
      console.log(`   ${category.toUpperCase()} (${items.length} keys):`);
      items.slice(0, 15).forEach((item) => {
        console.log(`      - ${item.key}: "${item.original}"`);
      });
      if (items.length > 15) {
        console.log(`      ... and ${items.length - 15} more`);
      }
      console.log('');
    }
  }

  // Apply changes if in write mode
  if (writeMode) {
    console.log('✏️  Applying changes...\n');

    // Update translation files
    locales.forEach((locale) => {
      const localeTranslations = { ...translations[locale] };

      allStrings.forEach((info, key) => {
        const existingKeys = getAllKeys(localeTranslations);
        if (!existingKeys.includes(key)) {
          let value: string;

          if (locale === 'en') {
            value = info.original;
          } else {
            value = ''; // TODO: Translate
          }

          setNestedValue(localeTranslations, key, value);
        }
      });

      saveTranslations(locale, localeTranslations);
      console.log(`   ✅ Updated ${locale}/translation.json`);
    });

    console.log('');

    // Update source files
    for (const change of fileChanges) {
      let content = change.originalContent;
      const hasUseTranslation = content.includes('useTranslation');
      const hasTFunction =
        content.includes('const { t }') || content.includes('{ t }');

      if (!hasUseTranslation) {
        const importLine = "import { useTranslation } from 'react-i18next';\n";
        const existingImport = content.match(
          /import.*from ['"]react-i18next['"]/,
        );
        if (existingImport) {
          content = content.replace(
            existingImport[0],
            `import { useTranslation } from 'react-i18next';`,
          );
        } else {
          const firstImport = content.match(/import .*\n/);
          if (firstImport) {
            content = content.replace(
              firstImport[0],
              importLine + firstImport[0],
            );
          }
        }
      }

      if (!hasTFunction && content.includes('useTranslation')) {
        const componentMatch = content.match(
          /(const \w+: \w+ = \([^)]*\) => \{)/,
        );
        if (componentMatch) {
          content = content.replace(
            componentMatch[1],
            `${componentMatch[1]}\n  const { t } = useTranslation();`,
          );
        }
      }

      content = change.newContent;
      fs.writeFileSync(change.file, content, 'utf-8');
      console.log(`   ✅ Modified ${path.relative(ROOT_DIR, change.file)}`);
    }

    console.log('\n✅ Done! Changes have been applied.\n');
    console.log('📌 Next steps:');
    console.log('   1. Review the changes in your translation files');
    console.log('   2. Add translations for Telugu (te) and Hindi (hi)');
    console.log('   3. Run the app and test the translations');
    console.log('   4. Run this script again to catch any missed strings\n');
  } else {
    console.log('\n💡 To apply changes, run:');
    console.log('   bun run scripts/extract-i18n-babel.ts --write\n');
  }

  // Report errors if any
  if (stats.errors.length > 0) {
    console.log('\n❌ Errors:');
    stats.errors.forEach((err) => console.log(`   - ${err}`));
  }
}

// Run
main().catch(console.error);
