import { axiosInstance } from "@/lib/axios";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
const REDIRECT_URI = `${window.location.origin}/callback`;

const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "user-library-read",
  "user-library-modify",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-top-read",
  "user-read-recently-played",
].join(" ");

const TOKEN_KEY = "spotify_access_token";
const EXPIRES_KEY = "spotify_expires_at";

export function getStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiresAt = localStorage.getItem(EXPIRES_KEY);
  if (!token || !expiresAt) return null;
  if (Date.now() > Number(expiresAt) - 60_000) return null;
  return token;
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

export async function redirectToSpotify(): Promise<void> {
  let clientId: string | undefined;
  try {
    const res = await axiosInstance.get("/spotify/client-id");
    clientId = res.data.clientId;
  } catch (err) {
    console.error("Failed to fetch Spotify Client ID from backend, falling back to static config:", err);
    clientId = CLIENT_ID;
  }

  if (!clientId) {
    console.error("Spotify Client ID is not configured.");
    return;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<boolean> {
  try {
    const res = await axiosInstance.post("/spotify/exchange", { code, redirectUri: REDIRECT_URI });
    if (res.data.success) {
      // Fetch token to populate local cache
      await getValidToken();
      return true;
    }
    return false;
  } catch (err) {
    console.error("Error exchanging code via backend:", err);
    return false;
  }
}

export async function getValidToken(): Promise<string | null> {
  // Check local cache first
  const stored = getStoredToken();
  if (stored) return stored;

  try {
    const res = await axiosInstance.get("/spotify/token");
    const token = res.data.access_token || null;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(EXPIRES_KEY, String(Date.now() + 55 * 60 * 1000)); // Cache for 55 minutes
    } else {
      clearTokens();
    }
    return token;
  } catch (err) {
    console.error("Error getting Spotify token from backend:", err);
    clearTokens();
    return null;
  }
}