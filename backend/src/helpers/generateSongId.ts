import crypto from "crypto";

function normalize(str) {
  return str
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[‐-‒–—]/g, "-")
    .replace(/\s*&\s*/g, " and ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Strip common title suffixes that don't change song identity
function stripTitleSuffixes(title) {
  return title
    // Remove feat/with clauses in parens or after dash: "(feat. X)", "- ft. X"
    .replace(/[\(\[]\s*(feat|ft|featuring|with)\.?\s+[^\)\]]+[\)\]]/gi, "")
    .replace(/\s*[-–—]\s*(feat|ft|featuring|with)\.?\s+.+$/gi, "")
    // Remove edition/version tags: "(Radio Edit)", "(Remastered 2011)", "[Live]"
    .replace(/[\(\[]\s*(radio edit|remaster(?:ed)?(?:\s+\d{4})?|single version|album version|live(?:\s+version)?|acoustic(?:\s+version)?|explicit|clean|extended|original mix|official(?: audio| video| lyric video)?)\s*[\)\]]/gi, "")
    .trim();
}

function primaryArtist(artist) {
  return normalize(
    artist
      // Handle parenthetical feat: "Artist (feat. Other)"
      .replace(/[\(\[]\s*(feat|ft|featuring|with)\.?\s+[^\)\]]+[\)\]]/gi, "")
      // Split on collab delimiters — avoid splitting "x" unless surrounded by spaces
      .split(/,|;|\s+feat\.?|\s+featuring\s+|\s+ft\.?\s+|\s+x\s+|\s*\/\s*/i)[0]
  );
}

function canonicalSongKey(title, artist) {
  return `${primaryArtist(artist)}|${normalize(stripTitleSuffixes(title))}`;
}

export const generateSongId = (title, artist) => {
  return crypto
    .createHash("sha256")
    .update(canonicalSongKey(title, artist))
    .digest("hex");
}