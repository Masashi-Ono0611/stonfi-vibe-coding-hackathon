const BOLD_RE = /^<b>.+?<\/b>\n*/;

export function boldTitle(text: string): string {
  if (BOLD_RE.test(text)) return text;

  const idx = text.indexOf("\n");
  if (idx === -1) return `<b>${text}</b>`;

  const title = text.slice(0, idx).trim();
  const body = text.slice(idx).trim();
  return `<b>${title}</b>\n\n${body}`;
}

export function ensureClosing(text: string, closing: string): string {
  if (!text.includes("I recommend")) {
    return `${text}\n\n${closing}`;
  }
  return text;
}
