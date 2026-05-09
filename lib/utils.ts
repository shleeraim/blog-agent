import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractJson(text: string): string {
  const start = text.indexOf('{');
  if (start === -1) throw new Error('No JSON found in response');

  // Build output char-by-char so we can repair literal control chars inside strings.
  // LLMs sometimes emit raw newlines (code 10) instead of the JSON escape \n, which
  // causes JSON.parse to throw "Unterminated string". We fix that here.
  let depth = 0;
  let inString = false;
  let escaped = false;
  const chars: string[] = [];

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);

    if (escaped) { escaped = false; chars.push(ch); continue; }

    if (inString) {
      if (ch === '\\') { escaped = true; chars.push(ch); continue; }
      if (ch === '"')  { inString = false; chars.push(ch); continue; }
      // Replace literal control characters with valid JSON escapes
      if (code === 10) { chars.push('\\n'); continue; }
      if (code === 13) { chars.push('\\r'); continue; }
      if (code === 9)  { chars.push('\\t'); continue; }
      chars.push(ch);
      continue;
    }

    if (ch === '"') { inString = true; chars.push(ch); continue; }
    if (ch === '{') { depth++; chars.push(ch); continue; }
    if (ch === '}') {
      depth--;
      chars.push(ch);
      if (depth === 0) return chars.join('');
      continue;
    }
    chars.push(ch);
  }

  throw new Error('Incomplete JSON object in response');
}
