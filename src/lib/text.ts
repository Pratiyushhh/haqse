/**
 * Strips the formatting a model leaves in prose.
 *
 * Without this, "**₹11,200**" is read aloud as "asterisk asterisk eleven
 * thousand two hundred asterisk asterisk", which is exactly the kind of
 * detail that makes an app feel broken to someone relying on the voice.
 * Pure and DOM-free so it is directly testable.
 */
export function plainText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
