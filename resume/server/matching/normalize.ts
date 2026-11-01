/**
 * Normalizes text so that keyword matching
 * is case-insensitive and whitespace-independent.
 */
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}
