//
// Data Section: Transliteration mappings for various languages
//

const lang_vowel: string[] = [
  "a aa A a' i ii ee ia i' I u uu oo U ua u' e E ea ae e' ai o O oe " +
    "oa o' au ou aq q Q sri 0 1 2 3 4 5 6 7 8 9 ^",
  "a aa A a' i ii ee ia i' I u uu oo U ua u' r'u Ru e E ea ae e' ai " +
    "o O oe oa o' au ou ~l ~L M @h @H @M q @2 oM OM 0 1 2 3 4 5 6 7 8 " +
    '9 | || ^',
  "a aa A a' i ii ee ia i' I u uu oo U ua u' R r' r'u Ru e E ea ae " +
    "e' ai o O oe oa o' au ou ~l ~L M @h @H @M @2 0 1 2 3 4 5 6 7 8 9 " +
    '| || ^',
  '` ~ 1 2 3 4 5 6 7 8 9 0 ) _ + q Q w W e E r R t T y Y u U i I o ' +
    'O p P [ { ] } a A s S d D f F g G h H j J k K l L \\ | z Z x X c ' +
    'C v V b B n N m M < . > /',
  'a A b B c C d D e E f F g G h H i I j J k K l L m M n N o O p P q ' +
    'Q r R s S t T u U v V w W x X y Y z Z [ ] { } " \' ; : < > 0 1 2 ' +
    '3 4 5 6 7 8 9 / \\ ~ | ? ! @ # _ + = & ^ * %',
  'a aA ai aI au aU ae aE aY ao aO aOU aq A i I u U e E Y o O OU k g ' +
    "f c F t N d n p b m y r l w v l' L R n' s S h j _ 0 1 2 3 4 5 6 7 " +
    '8 9',
  'a aA ai aI au aU aeV ae aE aEY aoV ao aO aOY aq aQ A i I u U eV ' +
    'e E EY oV o O OY M H z q Q k K g G f c C j J F t T d D N w W x ' +
    'X n p P b B m y r l v S s R h lY k_R w_r j_F S_r _ 0 1 2 3 4 5 6 ' +
    '7 8 9',
];

// lang_vowel_code: Unicode value for independent vowels
const lang_vowel_code: string[] = [
  '5,6,6,6,7,8,8,8,8,8,9,10,10,10,10,10,14,15,15,15,15,16,18,19,19,' +
    '19,19,20,20,3,3,3,56,77,48,64,102,103,104,105,106,107,108,109,' +
    '110,111,5260',
  '5,6,6,6,7,8,8,8,8,8,9,10,10,10,10,10,11,96,15,15,15,15,14,16,19,' +
    '19,19,19,18,20,20,12,97,2,3,3,1,60,61,80,80,102,103,104,105,106,' +
    '107,108,109,110,111,100,101,5900',
  '5,6,6,6,7,8,8,8,8,8,9,10,10,10,10,10,11,11,96,96,14,15,15,15,15,' +
    '16,18,19,19,19,19,20,20,12,97,2,3,3,1,-707,102,103,104,105,106,' +
    '107,108,109,110,111,-668,-667,5132',
  '61,60,103,104,105,106,107,108,109,110,111,102,112,82,5900,31,32,' +
    '76,20,71,72,48,67,36,37,47,30,65,66,63,64,75,19,42,43,7,8,15,16,' +
    '62,6,56,54,38,39,9,10,23,24,57,5,28,29,21,22,50,51,80,3,55,11,33,' +
    '34,27,28,53,1,44,45,40,35,46,2,25,100,101,77',
  '75,19,53,52,46,35,77,5,62,6,63,7,65,9,42,43,23,24,48,49,21,22,' +
    '36,37,56,54,50,51,38,39,28,29,76,20,64,8,71,15,66,10,57,25,40,41,' +
    '72,16,2,1,44,45,70,14,33,60,34,30,32,31,26,27,55,100,102,103,' +
    '104,105,106,107,108,109,110,111,47,73,74,17,95,13,69,18,3,11,67,' +
    '21 77 55,36 77 48,54 77 48,28 77 30',
  '5,6,7,8,9,10,14,15,16,18,19,20,3,62,63,64,65,66,70,71,72,74,75,' +
    '76,21,21,25,26,30,36,35,31,40,42,42,46,47,48,50,53,53,52,51,49,' +
    '41,56,55,57,28,77,102,103,104,105,106,107,108,109,110,111',
  '5,6,7,8,9,10,14,15,16,13,18,19,20,17,11,96,62,63,64,65,66,70,' +
    '71,72,69,74,75,76,73,2,3,1,67,68,21,22,23,24,25,26,27,28,29,30,' +
    '31,32,33,34,35,36,37,38,39,40,42,43,44,45,46,47,48,50,53,54,56,' +
    '55,57,51,21 77 55,36 77 48,28 77 30,54 77 48,77,102,103,104,105,' +
    '106,107,108,109,110,111',
];

// lang_vowel_symbol_code: Unicode value for dependent vowels (matras)
const lang_vowel_symbol_code: string[] = [
  ',62,62,62,63,64,64,64,64,64,65,66,66,66,66,66,70,71,71,71,71,72,' +
    '74,75,75,75,75,76,76,,,,,,,,,,,,,,,',
  ',62,62,62,63,64,64,64,64,64,65,66,66,66,66,66,67,68,71,71,71,71,' +
    '70,72,75,75,75,75,74,76,76,98,99,2,3,3,1,60,61,,,,,,,,,,,,,,,',
  ',62,62,62,63,64,64,64,64,64,65,66,66,66,66,66,67,67,68,68,70,71,' +
    '71,71,71,72,74,75,75,75,75,76,76,,,2,3,3,1,,,,,,,,,,,,,,',
];

// lang_consonant: Key map for consonant characters
const lang_consonant: string[] = [
  "ksh k kh K Kh g gh G Gh ~m ng c ch C Ch c' j jh J Jh ~n ny T t' " +
    "Th th' D d' Dh dh' N nh t th d dh n n' p ph f P Ph b bh B Bh m y " +
    "r R r' l L lh Lh l' z Z zh Zh v w S s' sh Sh s h H",
  "k kh kH K Kh KH g gh gH G Gh GH ~m c ch cH C Ch CH c' j jh jH J " +
    "Jh JH ~n T t' Th TH th' tH' D d' Dh DH dh' dH' N nh nH n' t th " +
    'tH d dh dH n p ph pH f P Ph PH b bh bH B Bh BH m y r l L lh v w ' +
    "S s' sh sH Sh SH s h H",
  "k kh kH K Kh KH g gh gH G Gh GH ~m c ch cH C Ch CH c' j jh jH J " +
    "Jh JH ~n T t' Th TH th' tH' D d' Dh DH dh' dH' N nh nH n' t th " +
    "tH d dh dH n p ph pH f P Ph PH b bh bH B Bh BH m y r l v w S s' " +
    'sh sH Sh SH s h H L lh Lh l\' r" ~r',
];

// lang_consonant_code: Unicode value for consonants
const lang_consonant_code: string[] = [
  '21 77 55,21,21,21,21,21,21,21,21,25,25,26,26,26,26,26,28,28,28,28,' +
    '30,30,31,31,31,31,31,31,31,31,35,35,36,36,36,36,40,41,42,42,42,42,' +
    '42,42,42,42,42,46,47,48,49,49,50,51,52,51,51,52,52,52,52,53,53,55,' +
    '55,55,55,56,57,57',
  '21,22,22,22,22,22,23,24,24,24,24,24,25,26,26,26,27,27,27,27,28,29,' +
    '29,29,29,29,30,31,31,32,32,32,32,33,33,34,34,34,34,35,35,35,35,36,' +
    '37,37,38,39,39,40,42,43,43,43,43,43,43,44,45,45,45,45,45,46,47,48,' +
    '50,51,52,53,53,54,54,55,55,55,55,56,57,57',
  '21,22,22,22,22,22,23,24,24,24,24,24,25,26,26,26,27,27,27,27,28,29,' +
    '29,29,29,29,30,31,31,32,32,32,32,33,33,34,34,34,34,35,35,35,35,36,' +
    '37,37,38,39,39,40,42,43,43,43,43,43,43,44,45,45,45,45,45,46,47,48,' +
    '50,53,53,54,54,55,55,55,55,56,57,57,51,51,51,51,49,49',
];

// Details stored in lang_details
const lang_details: string[][] = [
  ['telugu', '2', '2', '2', '2', '2', '0x0c00', '77'],
];

// --- Type Definitions ---
type MatchType = 'nomatch' | 'notexact' | 'exact' | '';
type CharsetType = 'vowel' | 'consonant' | '';

interface CharSetResult {
  match: MatchType;
  index: number;
  vowcount: number;
  conscount: number;
  charset: CharsetType;
  splvowcount: number;
}

interface SubSetResult {
  vowindex: number[];
  consindex: number[];
  match: CharsetType;
  exactindex: number;
}

interface TransliterationResult {
  str: string;
  indic: string;
  freezpos: number;
  bothcharset: boolean;
  charsetstr: string;
}

interface Suggestion {
  eng: string;
  indic: string;
}

// --- Module State Variables ---
let vowel: string[];
let vowel_code: string[];
let vowel_symbol_code: string[];
let consonant: string[];
let consonant_code: string[];
let codebase: number;
let halant: number;
let map_type: string;
let sortedConsonants: string[];

// --- Core Functions ---

/**
 * Parses a space-separated string of numbers and adds a value to each.
 * @returns A number array.
 */
function parseAndAdd(str: string, val: number): number[] {
  if (!str || str.trim() === '') return [];
  return str.split(' ').map((s) => parseInt(s, 10) + val);
}

/**
 * Creates a string from an array of character codes.
 */
function fromCharCodeArray(arr: number[]): string {
  return String.fromCharCode(...arr);
}

/**
 * Checks if a character is a special character (i.e., not an alphabet letter).
 */
function isSplChar(chr: string): boolean {
  if (chr === '') return true; // Treat empty string as a special character
  const ascii = chr.charCodeAt(0);
  return ascii < 65 || (ascii > 90 && ascii < 97) || ascii > 122;
}

/**
 * Finds the character set in which the string exists.
 */
function findCharSet(str: string): CharSetResult {
  let match: MatchType = 'nomatch';
  let index = -1;
  let charset: CharsetType = '';
  let consmatch: MatchType = '';
  let vowmatch: MatchType = '';
  let conscount = 0;
  let consindex = -1;
  let vowcount = 0;
  let vowindex = -1;
  let splvowcount = 0;
  let tempcount = 0;

  // Escape pipe characters for RegExp
  const tempstr = str.replace(/\|/g, '\\|');
  const exp = new RegExp(tempstr, 'i');

  for (let i = 0; i < vowel.length; i++) {
    const tempindex = vowel[i].indexOf(str);
    if (
      tempindex !== -1 &&
      (tempindex === 0 || isSplChar(vowel[i].charAt(0)))
    ) {
      vowcount++;
      if (
        map_type === 'many2many' &&
        vowel_symbol_code[i] === '' &&
        vowel_code[i] !== '5'
      ) {
        splvowcount++;
      }
      if (str === vowel[i]) {
        vowmatch = 'exact';
        vowindex = i;
      }
    }
    if (
      vowel[i].search(exp) !== -1 &&
      (vowel[i].search(exp) === 0 || isSplChar(vowel[i].charAt(0)))
    ) {
      tempcount++;
    }
  }
  if (vowcount > 0 && vowmatch === '') vowmatch = 'notexact';

  if (map_type === 'many2many_woh') {
    if (vowmatch !== '') match = vowmatch;
    return {
      match: match,
      index: vowindex,
      vowcount: vowcount,
      conscount: conscount,
      charset: 'vowel',
      splvowcount: vowcount,
    };
  }

  for (let i = 0; i < consonant.length; i++) {
    const tempindex = consonant[i].indexOf(str);
    if (
      tempindex !== -1 &&
      (tempindex === 0 || isSplChar(consonant[i].charAt(0)))
    ) {
      conscount++;
      if (str === consonant[i]) {
        consmatch = 'exact';
        consindex = i;
      }
    }
    if (
      consonant[i].search(exp) !== -1 &&
      (consonant[i].search(exp) === 0 || isSplChar(consonant[i].charAt(0)))
    ) {
      tempcount++;
    }
  }
  if (conscount > 0 && consmatch === '') consmatch = 'notexact';

  if (
    (vowmatch === '' && (consmatch === 'notexact' || consmatch === 'exact')) ||
    (vowmatch === 'notexact' && consmatch === 'exact')
  ) {
    charset = 'consonant';
    match = consmatch;
    index = consindex;
  } else if (vowmatch !== '') {
    charset = 'vowel';
    match = vowmatch;
    index = vowindex;
  }

  return {
    match: match,
    index: index,
    vowcount: vowcount,
    conscount: conscount,
    charset: charset,
    splvowcount: splvowcount,
  };
}

/**
 * Finds combinations that start with the character(s) in 'str'.
 */
function findSubSet(str: string, isCaseSensitive: boolean): SubSetResult {
  const vowindex: number[] = [];
  const consindex: number[] = [];

  // Escape pipe characters for RegExp
  const tempstr = str.replace(/\|/g, '\\|');
  const exp = isCaseSensitive ? new RegExp(tempstr) : new RegExp(tempstr, 'i');

  let exactVowel = -1;
  for (let i = 0, j = 0; i < vowel.length; i++) {
    const tempindex = vowel[i].search(exp);
    if (
      tempindex !== -1 &&
      (tempindex === 0 || isSplChar(vowel[i].charAt(0))) &&
      (!isCaseSensitive || vowel_symbol_code[i] !== '')
    ) {
      if (vowel[i] === str) exactVowel = j;
      vowindex[j++] = i;
    }
  }

  let match: CharsetType = '';
  let exactindex = -1;

  if (exactVowel !== -1) {
    match = 'vowel';
    exactindex = exactVowel;
  }

  if (map_type === 'many2many_woh') {
    return { vowindex, consindex, match, exactindex };
  }

  let exactConsonant = -1;
  for (let i = 0, j = 0; i < consonant.length; i++) {
    const tempindex = consonant[i].search(exp);
    if (
      tempindex !== -1 &&
      (tempindex === 0 || isSplChar(consonant[i].charAt(0)))
    ) {
      if (consonant[i] === str) exactConsonant = j;
      consindex[j++] = i;
    }
  }

  if (exactConsonant !== -1) {
    match = 'consonant';
    exactindex = exactConsonant;
  }

  return { vowindex, consindex, match, exactindex };
}

/**
 * The main transliteration engine. Converts an English string to its Indic equivalent.
 */
function getUniChar(str: string, mode?: 'inner'): TransliterationResult {
  let resultstr = '';
  let indic = '';
  let start = 0;
  let prevresult: CharSetResult | null = null;
  let isPrevHalf = false;
  let freezpos = 0;

  for (let i = 0; i < str.length; i++) {
    const newstr = str.substring(start, i + 1);
    const result = findCharSet(newstr);
    let match: string = '';

    if (result.match === 'nomatch') {
      match = 'nomatch';
    } else if (result.match === 'notexact') {
      match = 'notexact';
    } else if (result.charset === 'vowel') {
      match = result.vowcount + result.conscount === 1 ? 'vowel' : 'vowel*';
    } else if (result.charset === 'consonant') {
      match =
        result.vowcount + result.conscount === 1 ? 'consonant' : 'consonant*';
    }

    if (match === 'vowel') {
      if (
        isPrevHalf &&
        (vowel_code[result.index] === '5' ||
          vowel_symbol_code[result.index] !== '')
      ) {
        resultstr = resultstr.slice(0, -1); // Remove previous halant
        if (vowel_code[result.index] !== '5') {
          resultstr += fromCharCodeArray(
            parseAndAdd(vowel_symbol_code[result.index], codebase),
          );
        }
      } else {
        resultstr += fromCharCodeArray(
          parseAndAdd(vowel_code[result.index], codebase),
        );
      }
      start = i + 1;
      indic = '';
      isPrevHalf = false;
      freezpos = start;
    } else if (match === 'consonant') {
      indic = fromCharCodeArray(
        parseAndAdd(`${consonant_code[result.index]} ${halant}`, codebase),
      );
      resultstr += indic;
      freezpos = start;
      start = i + 1;
      isPrevHalf = true;
    } else if (
      match === 'nomatch' ||
      (result.match === 'notexact' && mode === 'inner')
    ) {
      if (newstr.length === 1) {
        if (isSplChar(newstr.charAt(0))) {
          resultstr += newstr;
        }
        start = i + 1;
        isPrevHalf = false;
        indic = '';
        freezpos = start;
      } else if (prevresult && prevresult.match === 'notexact') {
        if (newstr.length === 2) {
          if (isSplChar(newstr.charAt(0))) {
            resultstr += newstr.charAt(0);
          }
          indic = '';
          start = i;
          freezpos = start;
          i--;
          isPrevHalf = false;
        } else {
          resultstr = resultstr.slice(0, -indic.length);
          const tempresult = getUniChar(
            str.substring(freezpos, start) + newstr.slice(0, -1),
            'inner',
          );
          indic = tempresult.indic;
          freezpos += tempresult.freezpos;
          start = i;
          i--;
          resultstr += tempresult.str;
          if (
            map_type === 'many2many' &&
            indic.charCodeAt(indic.length - 1) === halant + codebase
          ) {
            isPrevHalf = true;
          } else {
            isPrevHalf = false;
          }
        }
      } else if (
        prevresult &&
        prevresult.charset === 'vowel' &&
        prevresult.vowcount + prevresult.conscount > 1
      ) {
        if (
          isPrevHalf &&
          (vowel_code[prevresult.index] === '5' ||
            vowel_symbol_code[prevresult.index] !== '')
        ) {
          resultstr = resultstr.slice(0, -1);
          if (vowel_code[prevresult.index] !== '5') {
            resultstr += fromCharCodeArray(
              parseAndAdd(vowel_symbol_code[prevresult.index], codebase),
            );
          }
        } else {
          resultstr += fromCharCodeArray(
            parseAndAdd(vowel_code[prevresult.index], codebase),
          );
        }
        start = i;
        freezpos = start;
        i--;
        isPrevHalf = false;
        indic = '';
      } else if (
        prevresult &&
        prevresult.charset === 'consonant' &&
        prevresult.vowcount + prevresult.conscount > 1
      ) {
        indic = fromCharCodeArray(
          parseAndAdd(
            `${consonant_code[prevresult.index]} ${halant}`,
            codebase,
          ),
        );
        resultstr += indic;
        freezpos = start;
        start = i;
        i--;
        isPrevHalf = true;
      }
    } else if (i === str.length - 1) {
      // Handle end of string
      if (match === 'vowel*') {
        if (result.splvowcount === result.vowcount) {
          freezpos = start;
          indic = '';
        }
        resultstr = resultstr.slice(0, -indic.length);
        if (
          isPrevHalf &&
          (vowel_code[result.index] === '5' ||
            vowel_symbol_code[result.index] !== '')
        ) {
          indic = indic.slice(0, -1);
          if (vowel_code[result.index] !== '5') {
            indic += fromCharCodeArray(
              parseAndAdd(vowel_symbol_code[result.index], codebase),
            );
          }
        } else {
          indic += fromCharCodeArray(
            parseAndAdd(vowel_code[result.index], codebase),
          );
        }
        resultstr += indic;
      } else if (match === 'consonant*') {
        const temp = fromCharCodeArray(
          parseAndAdd(`${consonant_code[result.index]} ${halant}`, codebase),
        );
        if (result.vowcount === 0 || result.splvowcount === result.vowcount) {
          freezpos = start;
          indic = temp;
        } else {
          // Return context for ambiguity resolution
          return {
            str: resultstr + temp,
            indic: indic + temp,
            freezpos,
            bothcharset: true,
            charsetstr: newstr,
          };
        }
        resultstr += temp;
      } else if (match === 'notexact') {
        if (newstr.length === 1) {
          if (isSplChar(newstr.charAt(0))) {
            indic += newstr;
            resultstr += newstr;
          }
          if (map_type === 'many2many') {
            if (result.vowcount === 0) {
              indic = newstr;
              freezpos = start;
            } else {
              // Return context for ambiguity resolution
              return {
                str: resultstr,
                indic,
                freezpos,
                bothcharset: true,
                charsetstr: newstr,
              };
            }
          }
        } else {
          resultstr = resultstr.slice(0, -indic.length);
          const tempresult = getUniChar(
            str.substring(freezpos, start) + newstr,
            'inner',
          );
          indic = tempresult.str;
          resultstr += tempresult.str;
        }
      }
    }
    prevresult = result;
  }
  return {
    str: resultstr,
    indic,
    freezpos,
    bothcharset: false,
    charsetstr: '',
  };
}

// --- Public API ---

/**
 * Initializes the transliteration engine for a specific language.
 * This must be called before using other functions.
 */
export function initialize(): void {
  const teluguConfig = lang_details[0]; // Hardcoded for Telugu
  const vowel_index = parseInt(teluguConfig[1], 10);
  const vowel_code_index = parseInt(teluguConfig[2], 10);
  const vowel_symbol_code_index = parseInt(teluguConfig[3], 10);
  const consonant_index = parseInt(teluguConfig[4], 10);
  const consonant_code_index = parseInt(teluguConfig[5], 10);

  codebase = parseInt(teluguConfig[6], 16); // Hexadecimal
  halant = parseInt(teluguConfig[7], 10);

  vowel = lang_vowel[vowel_index].split(' ');
  vowel_code = lang_vowel_code[vowel_code_index].split(',');
  vowel_symbol_code =
    lang_vowel_symbol_code[vowel_symbol_code_index].split(',');
  consonant = lang_consonant[consonant_index].split(' ');
  consonant_code = lang_consonant_code[consonant_code_index].split(',');
  map_type = 'many2many';

  // Create a pre-sorted list of consonants for efficient matching
  sortedConsonants = [...consonant].sort((a, b) => b.length - a.length);
}

/**
 * Finds the longest matching base consonant at the beginning of a string.
 */
function findBaseConsonant(sequence: string): string | null {
  if (!sequence || !sortedConsonants) return null;
  return sortedConsonants.find((c) => sequence.startsWith(c)) || null;
}

/**
 * The exported transliteration function.
 */
export const transliterate = getUniChar;

/**
 * Generates suggestions for the currently typed prefix.
 */
const getSuggestions = (str: string): Suggestion[] => {
  if (!str) return [];

  const result = findSubSet(str, false);
  const suggestions: Suggestion[] = [];

  // Vowel suggestions
  result.vowindex.forEach((i) => {
    suggestions.push({
      eng: vowel[i],
      indic: fromCharCodeArray(parseAndAdd(vowel_code[i], codebase)),
    });
  });

  // Consonant suggestions
  result.consindex.forEach((i) => {
    suggestions.push({
      eng: consonant[i],
      indic: fromCharCodeArray(
        parseAndAdd(`${consonant_code[i]} ${halant}`, codebase),
      ),
    });
  });

  return suggestions;
};

/**
 * Generates all vowel combinations for a given base consonant.
 * e.g., "k" -> "ka", "kaa", "ki", "kii", etc.
 */
function getVowelCombinations(baseConsonant: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const consonantIndex = consonant.indexOf(baseConsonant);

  // Abort if the input string is not a valid consonant
  if (consonantIndex === -1) {
    return [];
  }

  // Get the base consonant character code (without halant)
  const baseConsonantCode = parseAndAdd(
    consonant_code[consonantIndex],
    codebase,
  );

  // Loop through all defined vowels
  for (let i = 0; i < vowel.length; i++) {
    // Only include actual vowels that can be combined, not standalone symbols or numbers
    const isCombinableVowel =
      vowel_symbol_code[i] !== '' || vowel_code[i] === '5';
    if (!isCombinableVowel) {
      continue;
    }

    const eng = baseConsonant + vowel[i];
    let indic = fromCharCodeArray(baseConsonantCode); // Start with the base consonant, e.g., "క"

    // If it's not the inherent vowel 'a', add the vowel sign (matra)
    if (vowel_code[i] !== '5') {
      const vowelSignCode = parseAndAdd(vowel_symbol_code[i], codebase);
      indic += fromCharCodeArray(vowelSignCode);
    }

    suggestions.push({ eng, indic });
  }

  return suggestions;
}

// Export public functions and data
export { getSuggestions, getVowelCombinations, consonant, findBaseConsonant };
