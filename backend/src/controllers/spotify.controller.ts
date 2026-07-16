import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model.js";
import { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from "../config/index.js";

async function getValidAccessToken(user: any): Promise<string | null> {
    if (!user.spotify_refresh_token) return null;

    const isExpired = !user.spotify_expires_at || (Date.now() > user.spotify_expires_at.getTime() - 60 * 1000);
    if (!isExpired && user.spotify_access_token) {
        return user.spotify_access_token;
    }

    try {
        const authHeader = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");
        const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": `Basic ${authHeader}`
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: user.spotify_refresh_token
            })
        });

        if (!tokenRes.ok) {
            console.error("Failed to refresh Spotify token:", await tokenRes.text());
            return null;
        }

        const data = await tokenRes.json() as {
            access_token: string;
            expires_in: number;
            refresh_token?: string;
        };

        user.spotify_access_token = data.access_token;
        user.spotify_expires_at = new Date(Date.now() + data.expires_in * 1000);
        if (data.refresh_token) {
            user.spotify_refresh_token = data.refresh_token;
        }

        await user.save();
        return data.access_token;
    } catch (err) {
        console.error("Error refreshing Spotify token:", err);
        return null;
    }
}

class SpotifyController {
    public exchangeCode = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { code, redirectUri } = req.body;
            const userId = (req as any).auth.userId;

            if (!code) {
                return res.status(400).json({ message: "Code is required" });
            }

            const rUri = redirectUri || "http://localhost:3000/callback";
            const authHeader = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64");

            const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Basic ${authHeader}`
                },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    code,
                    redirect_uri: rUri
                })
            });

            if (!tokenRes.ok) {
                const errText = await tokenRes.text();
                console.error("Spotify token exchange failed:", errText);
                return res.status(400).json({ message: "Failed to exchange authorization code with Spotify", error: errText });
            }

            const tokenData = await tokenRes.json() as {
                access_token: string;
                refresh_token: string;
                expires_in: number;
            };

            // Fetch Spotify user info
            const meRes = await fetch("https://api.spotify.com/v1/me", {
                headers: {
                    "Authorization": `Bearer ${tokenData.access_token}`
                }
            });

            if (!meRes.ok) {
                return res.status(400).json({ message: "Failed to fetch Spotify user profile information" });
            }

            const meData = await meRes.json() as { id: string };

            // Update user in DB
            const user = await User.findOne({ clerkId: userId });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            user.spotify_user_id = meData.id;
            user.spotify_access_token = tokenData.access_token;
            user.spotify_refresh_token = tokenData.refresh_token;
            user.spotify_expires_at = new Date(Date.now() + tokenData.expires_in * 1000);

            await user.save();

            res.status(200).json({ success: true, spotify_user_id: meData.id });
        } catch (error) {
            console.error("Error in Spotify exchangeCode:", error);
            next(error);
        }
    };

    public getToken = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).auth.userId;
            const user = await User.findOne({ clerkId: userId });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (!user.spotify_refresh_token) {
                return res.status(200).json({ access_token: null });
            }

            const token = await getValidAccessToken(user);
            res.status(200).json({ access_token: token });
        } catch (error) {
            console.error("Error in Spotify getToken:", error);
            next(error);
        }
    };

    public proxy = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).auth.userId;
            const user = await User.findOne({ clerkId: userId });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const accessToken = await getValidAccessToken(user);
            if (!accessToken) {
                return res.status(401).json({ message: "Spotify not connected or unauthorized" });
            }

            const path = req.query.path as string;
            if (!path) {
                return res.status(400).json({ message: "Query parameter 'path' is required" });
            }

            // Rebuild search query parameters
            const queryParams = { ...req.query };
            delete queryParams.path;
            const queryString = new URLSearchParams(queryParams as any).toString();
            const url = `https://api.spotify.com/v1${path}${queryString ? "?" + queryString : ""}`;

            const headers: Record<string, string> = {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            };

            const fetchOptions: RequestInit = {
                method: req.method,
                headers
            };

            if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
                fetchOptions.body = JSON.stringify(req.body);
            }

            const spotifyRes = await fetch(url, fetchOptions);

            if (spotifyRes.status === 204 || spotifyRes.status === 205) {
                return res.status(spotifyRes.status).send();
            }

            const text = await spotifyRes.text();
            let data;
            try {
                data = text ? JSON.parse(text) : undefined;
            } catch {
                data = text;
            }

            res.status(spotifyRes.status).json(data);
        } catch (error) {
            console.error("Error in Spotify proxy:", error);
            next(error);
        }
    };
}

export default SpotifyController;
