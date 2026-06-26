/**
 * Splits a collaborative artist string (e.g. "Seedhe Maut feat. Arpit Bala & Nanku")
 * into individual trimmed artist names using various common separators.
 */
export function parseArtistNames(artistStr) {
    if (!artistStr)
        return [];
    // Regular expression matching separators:
    // - , (comma)
    // - & (ampersand)
    // - \bfeat\.?\b (feat, feat. with word boundaries)
    // - \bft\.?\b (ft, ft. with word boundaries)
    // - \bfeaturing\b (featuring)
    // - \bx\b (case-insensitive "x" as a word separator)
    // - \/ (forward slash)
    const separatorRegex = /\s*(?:,|\bfeat\.?\b|\bft\.?\b|\bfeaturing\b|&|\bx\b|\/)\s*/i;
    return artistStr
        .split(separatorRegex)
        .map(name => name.trim())
        .filter(name => name.length > 0 && name.toLowerCase() !== "various artists");
}
