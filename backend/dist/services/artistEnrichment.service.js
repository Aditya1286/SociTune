import { GoogleGenerativeAI } from "@google/generative-ai";
import { Artist } from "../models/artist.model.js";
import SpotifyService from "./spotify.service.js";
import Singleton from "../utils/Singleton.js";
class ArtistEnrichmentService {
    async enrichArtist(artistName) {
        // 1. Fetch official Spotify metadata first
        let spotifyData = null;
        try {
            const spotifyService = Singleton.instance(SpotifyService);
            spotifyData = await spotifyService.getArtistDetails(artistName);
            console.log(`[ArtistEnrichment] Spotify details for ${artistName}:`, spotifyData ? "FOUND" : "NOT FOUND");
        }
        catch (err) {
            console.error("[ArtistEnrichment] Spotify metadata lookup failed:", err);
        }
        const apiKey = process.env.GEMINI_API_KEY;
        let data = {};
        if (apiKey) {
            try {
                console.log(`[ArtistEnrichment] Querying Gemini AI to enrich artist: ${artistName}`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
                const prompt = `You are a professional music database editor and metadata expert.
Provide verified details about the artist "${artistName}".
Response MUST be a single, valid JSON object matching the following structure:
{
  "name": "${artistName}",
  "imageUrl": "URL to a high-quality professional photo of this artist (e.g. from Wikimedia Commons, official site, etc.)",
  "bio": "A well-written 2-3 sentence biography of the artist.",
  "genres": ["Genre1", "Genre2"],
  "country": "Country name",
  "instagram": "Instagram username or URL",
  "youtube": "YouTube channel URL",
  "spotify": "Spotify profile URL",
  "website": "Official website URL",
  "monthlyListeners": 1234567, // estimated number
  "followers": 500000, // estimated number of followers
  "verified": true, // boolean (true if highly popular or verified)
  "popularSongs": ["Song Title 1", "Song Title 2", "Song Title 3", "Song Title 4", "Song Title 5"], // 5 of their biggest popular songs
  "similarArtists": ["Artist Name 1", "Artist Name 2", "Artist Name 3"] // 3-4 similar artists
}

Important Rules:
1. Do not add any markdown formatting (like \`\`\`json or \`\`\`). Just return the raw JSON string.
2. Do not fabricate information. If you cannot find any true detail (like an image URL or specific social link), omit the field or return an empty string or empty array.
3. The response must be strictly valid JSON. Do not include comments.`;
                const result = await model.generateContent(prompt);
                const text = result.response.text().trim();
                let jsonText = text;
                if (jsonText.startsWith("```")) {
                    jsonText = jsonText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "");
                }
                jsonText = jsonText.trim();
                data = JSON.parse(jsonText);
                console.log(`[ArtistEnrichment] Successfully parsed Gemini response for artist: ${artistName}`);
            }
            catch (error) {
                console.error(`[ArtistEnrichment] Failed to query Gemini for artist "${artistName}":`, error);
            }
        }
        try {
            // Find the artist document
            const escapedName = artistName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            let artistDoc = await Artist.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, "i") } });
            if (!artistDoc) {
                artistDoc = new Artist({
                    name: artistName,
                    imageUrl: spotifyData?.imageUrl || data.imageUrl || "/albums/default.jpg"
                });
            }
            // Update fields from Spotify (Primary source for image, followers, genres, and spotify URL)
            if (spotifyData?.imageUrl)
                artistDoc.imageUrl = spotifyData.imageUrl;
            if (spotifyData?.followers)
                artistDoc.followers = spotifyData.followers;
            if (spotifyData?.genres && spotifyData.genres.length > 0)
                artistDoc.genres = spotifyData.genres;
            if (spotifyData?.spotifyUrl)
                artistDoc.spotify = spotifyData.spotifyUrl;
            // Update fields from Gemini (Fallback and secondary sources)
            if (!artistDoc.imageUrl && data.imageUrl && data.imageUrl.startsWith("http")) {
                artistDoc.imageUrl = data.imageUrl;
            }
            if (data.bio)
                artistDoc.bio = data.bio;
            if ((!artistDoc.genres || artistDoc.genres.length === 0) && data.genres && data.genres.length > 0) {
                artistDoc.genres = data.genres;
            }
            if (data.country)
                artistDoc.country = data.country;
            if (data.monthlyListeners)
                artistDoc.monthlyListeners = Number(data.monthlyListeners);
            if (!artistDoc.followers && data.followers)
                artistDoc.followers = Number(data.followers);
            if (data.verified !== undefined)
                artistDoc.verified = !!data.verified;
            if (data.instagram)
                artistDoc.instagram = data.instagram;
            if (data.youtube)
                artistDoc.youtube = data.youtube;
            if (!artistDoc.spotify && data.spotify)
                artistDoc.spotify = data.spotify;
            if (data.website)
                artistDoc.website = data.website;
            if (data.similarArtists)
                artistDoc.similarArtists = data.similarArtists;
            // Popular songs returned by Gemini
            if (data.popularSongs && data.popularSongs.length > 0) {
                artistDoc.moreSongs = data.popularSongs.map((title) => ({
                    title,
                    isInformationalOnly: true
                }));
            }
            artistDoc.enriched = true;
            await artistDoc.save();
            console.log(`[ArtistEnrichment] Saved enriched data for artist: ${artistName}`);
            return artistDoc;
        }
        catch (error) {
            console.error(`[ArtistEnrichment] Failed to save/update artist "${artistName}":`, error);
        }
        return null;
    }
}
export default ArtistEnrichmentService;
