export class Tokenizer {
  tokenize(line: string): string[] {
    if (!line.trim() || line.trimStart().startsWith('#')) return [];
    const tokens: string[] = [];
    let token = '', quoted = false, started = false;
    for (let index = 0; index < line.length; index++) {
      const char = line[index];
      if (char === '"') { quoted = !quoted; started = true; }
      else if (char === '\\' && quoted && ['"', '\\'].includes(line[index + 1])) { token += line[++index]; started = true; }
      else if (/\s/.test(char) && !quoted) {
        if (started) { tokens.push(token); token = ''; started = false; }
      } else { token += char; started = true; }
    }
    if (quoted) throw new Error('unterminated quoted argument');
    if (started) tokens.push(token);
    return tokens;
  }
}
