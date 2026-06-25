class SpotifyService {
    async getAccessToken() {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            console.log("[SpotifyService] Missing Spotify Client ID or Client Secret");
            return null;
        }
        try {
            const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64")
                },
                body: "grant_type=client_credentials"
            });
            const tokenData = await tokenRes.json();
            return tokenData.access_token || null;
        }
        catch (error) {
            console.error("[SpotifyService] Failed to obtain access token:", error);
            return null;
        }
    }
    async getArtistDetails(artistName) {
        const token = await this.getAccessToken();
        if (!token)
            return null;
        try {
            const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            const searchData = await searchRes.json();
            const artist = searchData.artists?.items?.[0];
            if (artist) {
                return {
                    imageUrl: artist.images?.[0]?.url || undefined,
                    spotifyUrl: artist.external_urls?.spotify || undefined,
                    followers: artist.followers?.total || undefined,
                    genres: artist.genres || undefined
                };
            }
        }
        catch (error) {
            console.error(`[SpotifyService] Failed to get artist details for ${artistName}:`, error);
        }
        return null;
    }
}
export default SpotifyService;
