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
 * strings are blanked. Regex literals are left alone: telling `/` division from
 * `/` regex needs a parser, and the patterns here don't match escaped source.
 */

type Mode = 'code' | 'single' | 'double' | 'template';

const blank = (s: string) => s.replace(/[^\n]/g, ' ');

function strip(source: string, blankStrings: boolean): string {
  const hide = blankStrings ? blank : (s: string) => s;
  const n = source.length;
  // The code-brace depth at which each open `${` interpolation started, one
  // entry per template literal we are currently inside an interpolation of.
  const interpolations: number[] = [];
  let out = '';
  let mode: Mode = 'code';
  let braceDepth = 0;
  let i = 0;

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
      } else if (ch === '"' || ch === "'" || ch === '`') {
        mode = ch === '"' ? 'double' : ch === "'" ? 'single' : 'template';
        out += ch;
        i++;
      } else if (ch === '{') {
        braceDepth++;
        out += ch;
        i++;
      } else if (ch === '}' && interpolations.at(-1) === braceDepth) {
        // Closes the innermost `${`, putting us back inside its template.
        interpolations.pop();
        mode = 'template';
        out += hide(ch);
        i++;
      } else {
        if (ch === '}') braceDepth = Math.max(0, braceDepth - 1);
        out += ch;
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
    } else {
      out += hide(ch);
    }
    i++;
  }

  return out;
}

/** Blanks comments, leaving string literals intact. */
export const stripComments = (source: string) => strip(source, false);

/** Blanks comments and string literals, leaving `${...}` interpolations intact. */
export const stripCommentsAndStrings = (source: string) => strip(source, true);

/** Extensions whose syntax `strip` actually understands. */
const STRIPPABLE = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);

export const isStrippable = (file: string) => STRIPPABLE.has(file.slice(file.lastIndexOf('.')).toLowerCase());
