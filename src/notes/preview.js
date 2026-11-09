const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

export function htmlToPreview(html, maxLength = 140) {
  const text = html
    .replace(/<\/(p|h[1-6]|li|blockquote)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

export function isBlankNote(note) {
  return !note.title.trim() && !htmlToPreview(note.html) && note.tags.length === 0;
}
