import dotenv from 'dotenv';

dotenv.config();

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

async function run() {
  try {
    console.log("Authenticating with Spotify...");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64")
      },
      body: "grant_type=client_credentials"
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.access_token;
    console.log("AccessToken obtained:", token ? "YES" : "NO");

    const artistName = "Chaar Diwaari";
    console.log(`Searching Spotify for artist: ${artistName}...`);
    const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const searchData = await searchRes.json();
    const artist = searchData.artists?.items?.[0];
    if (artist) {
      console.log("Found Artist on Spotify!");
      console.log("Name:", artist.name);
      console.log("Images:", artist.images);
      console.log("Genres:", artist.genres);
      console.log("Followers:", artist.followers?.total);
    } else {
      console.log("Artist not found");
    }
  } catch (error) {
    console.error("Spotify Error:", error);
  }
}

run();
