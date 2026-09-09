/**
 * Blanks out the parts of a JS/TS source file that are prose rather than code,
 * so pattern checks stop firing on files that merely *describe* a dangerous
 * construct — linters, security tooling, OWASP material, XSS tutorials, and
 * this scanner's own rule definitions.
 *
 * Blanked spans are replaced space-for-space and newlines are preserved, so
 * line and column numbers survive unchanged.
 *
 * Template interpolations (`${...}`) are real code and stay visible even when
 * strings are blanked. Regex literals are treated as text like strings, and are
 * recognised before the quote rules so that a quote or backtick inside one does
 * not put the scanner into string mode and blank the rest of the file.
 */

type Mode = 'code' | 'single' | 'double' | 'template';

const blank = (s: string) => s.replace(/[^\n]/g, ' ');

// A `/` is division when the previous token is a value, and starts a regex
// literal otherwise. Keywords end in word characters, so allow the ones that
// can precede a regex.
const DIVIDES_AFTER = /[)\]}\w$]$/;
const KEYWORD_BEFORE_REGEX = /\b(return|typeof|instanceof|in|of|new|delete|void|throw|case|do|else|yield|await)$/;

const startsRegex = (sig: string) => sig === '' || !DIVIDES_AFTER.test(sig) || KEYWORD_BEFORE_REGEX.test(sig);

function strip(source: string, blankStrings: boolean): string {
  const hide = blankStrings ? blank : (s: string) => s;
  const n = source.length;
  // The code-brace depth at which each open `${` interpolation started, one
  // entry per template literal we are currently inside an interpolation of.
  const interpolations: number[] = [];
  let out = '';
  let mode: Mode = 'code';
  let braceDepth = 0;
  // The last few significant code characters, used to tell division from a
  // regex literal. Whitespace is dropped so line breaks do not hide a keyword.
  let sig = '';
  let i = 0;

  const emit = (ch: string) => {
    out += ch;
    if (!/\s/.test(ch)) sig = (sig + ch).slice(-12);
  };

  while (i < n) {
    const ch = source[i];
    const two = source.slice(i, i + 2);

    if (mode === 'code') {
      if (two === '//') {
        const nl = source.indexOf('\n', i);
        const end = nl === -1 ? n : nl;
        out += blank(source.slice(i, end));
        i = end;
      } else if (two === '/*') {
        const close = source.indexOf('*/', i + 2);
        const end = close === -1 ? n : close + 2;
        out += blank(source.slice(i, end));
        i = end;
      } else if (ch === '/' && startsRegex(sig)) {
        // A regex literal cannot span a newline, so stop there if the closing
        // delimiter is missing and this was really division after all.
        out += ch;
        i++;
        let inClass = false;
        while (i < n && source[i] !== '\n') {
          const c = source[i];
          if (c === '\\') {
            out += hide(source.slice(i, i + 2));
            i += 2;
            continue;
          }
          if (c === '/' && !inClass) break;
          if (c === '[') inClass = true;
          else if (c === ']') inClass = false;
          out += hide(c);
          i++;
        }
        if (i < n && source[i] === '/') {
          out += '/';
          i++;
        }
        sig = 'x';
      } else if (ch === '"' || ch === "'" || ch === '`') {
        mode = ch === '"' ? 'double' : ch === "'" ? 'single' : 'template';
        out += ch;
        i++;
      } else if (ch === '{') {
        braceDepth++;
        emit(ch);
        i++;
      } else if (ch === '}' && interpolations.at(-1) === braceDepth) {
        // Closes the innermost `${`, putting us back inside its template.
        interpolations.pop();
        mode = 'template';
        out += hide(ch);
        i++;
      } else {
        if (ch === '}') braceDepth = Math.max(0, braceDepth - 1);
        emit(ch);
        i++;
      }
      continue;
    }

    if (ch === '\\') {
      out += hide(source.slice(i, i + 2));
      i += 2;
      continue;
    }

    if (mode === 'template') {
      if (two === '${') {
        interpolations.push(braceDepth);
        mode = 'code';
        out += hide(two);
        i += 2;
      } else if (ch === '`') {
        mode = 'code';
        out += ch;
        sig = 'x';
        i++;
      } else {
        out += hide(ch);
        i++;
      }
      continue;
    }

    // A quoted string cannot span a newline; recover there rather than swallow
    // the rest of the file on an apostrophe in a comment we failed to detect.
    if (ch === (mode === 'single' ? "'" : '"') || ch === '\n') {
      mode = 'code';
      out += ch;
      sig = 'x';
    } else {
      out += hide(ch);
    }
    i++;
  }

  return out;
}

/** Blanks comments, leaving string and regex literals intact. */
export const stripComments = (source: string) => strip(source, false);

/** Blanks comments, strings and regex literals, keeping `${...}` interpolations. */
export const stripCommentsAndStrings = (source: string) => strip(source, true);

/** Extensions whose syntax `strip` actually understands. */
const STRIPPABLE = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);

export const isStrippable = (file: string) => STRIPPABLE.has(file.slice(file.lastIndexOf('.')).toLowerCase());
