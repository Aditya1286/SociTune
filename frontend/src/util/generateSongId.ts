function normalize(str: string) {
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

function stripTitleSuffixes(title: string) {
  return title
    .replace(/[\(\[]\s*(feat|ft|featuring|with)\.?\s+[^\)\]]+[\)\]]/gi, "")
    .replace(/\s*[-–—]\s*(feat|ft|featuring|with)\.?\s+.+$/gi, "")
    .replace(/[\(\[]\s*(radio edit|remaster(?:ed)?(?:\s+\d{4})?|single version|album version|live(?:\s+version)?|acoustic(?:\s+version)?|explicit|clean|extended|original mix|official(?: audio| video| lyric video)?)\s*[\)\]]/gi, "")
    .trim();
}

function primaryArtist(artist: string) {
  return normalize(
    artist
      .replace(/[\(\[]\s*(feat|ft|featuring|with)\.?\s+[^\)\]]+[\)\]]/gi, "")
      .split(/,|;|\s+feat\.?|\s+featuring\s+|\s+ft\.?\s+|\s+x\s+|\s*\/\s*/i)[0]
  );
}

function canonicalSongKey(title: string, artist: string) {
  return `${primaryArtist(artist)}|${normalize(stripTitleSuffixes(title))}`;
}

export async function generateSongId(title: string, artist: string): Promise<string> {
  const key = canonicalSongKey(title, artist);
  const msgUint8 = new TextEncoder().encode(key);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
