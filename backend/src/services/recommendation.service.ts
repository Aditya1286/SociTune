import { User } from "../models/user.model.js";
import { Song } from "../models/song.model.js";
import { PlayHistory } from "../models/playHistory.model.js";

const MACRO_CLUSTERS = [
    "pop", "rock", "hip_hop", "r&b_soul", "electronic_dance", "jazz", "classical", 
    "country", "latin", "metal", "folk_indie", "punk", "blues", "reggae", "world_music", 
    "gospel_christian", "new_age_ambient", "spoken_word", "k_pop_j_pop", "afrobeats", 
    "flamenco_bossa", "experimental_avant_garde", "children", "holiday_seasonal"
];

// Helper to map any genre string to a macro cluster
function mapToMacroCluster(genreStr) {
    if (!genreStr) return "pop";
    const g = genreStr.toLowerCase();
    for (const cluster of MACRO_CLUSTERS) {
        if (g.includes(cluster.replace('_', ' '))) return cluster;
    }
    if (g.includes("indie")) return "folk_indie";
    if (g.includes("house") || g.includes("techno") || g.includes("edm") || g.includes("dubstep") || g.includes("phonk")) return "electronic_dance";
    if (g.includes("rap") || g.includes("trap") || g.includes("drill")) return "hip_hop";
    if (g.includes("rnb") || g.includes("soul") || g.includes("funk")) return "r&b_soul";
    if (g.includes("acoustic") || g.includes("singer-songwriter") || g.includes("cottagecore")) return "folk_indie";
    if (g.includes("core") || g.includes("death") || g.includes("shred")) return "metal";
    if (g.includes("lo-fi") || g.includes("ambient") || g.includes("chill")) return "new_age_ambient";
    return "pop"; // fallback
}

// Map Valence + Energy to Circumplex Quadrants
function getMoodQuadrant(valence, energy) {
    if (valence >= 0.5 && energy >= 0.5) return "happy-energetic";
    if (valence >= 0.5 && energy < 0.5) return "happy-calm";
    if (valence < 0.5 && energy >= 0.5) return "sad-energetic";
    return "sad-calm";
}

function getQuadrantSimilarity(q1, q2) {
    if (q1 === q2) return 1.0;
    // Opposite check
    if ((q1 === "happy-energetic" && q2 === "sad-calm") || (q2 === "happy-energetic" && q1 === "sad-calm")) return 0.0;
    if ((q1 === "happy-calm" && q2 === "sad-energetic") || (q2 === "happy-calm" && q1 === "sad-energetic")) return 0.0;
    // Adjacent
    return 0.5;
}

// Cosine similarity for vectors
function cosineSimilarity(vecA, vecB, weights) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (const key in vecA) {
        const a = vecA[key];
        const b = vecB[key];
        const w = weights[key] || 1;
        dotProduct += (a * w) * (b * w);
        normA += (a * w) * (a * w);
        normB += (b * w) * (b * w);
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

class MusicRecommender {
    public similarityThreshold: number;
    public users: Map<string, any>;
    public songCatalog: Map<string, any>;
    public similarityCache: Map<string, any>;
    public isInitialized: boolean;

    constructor(similarityThreshold = 30) {
        this.similarityThreshold = similarityThreshold;
        this.users = new Map<string, any>();       
        this.songCatalog = new Map<string, any>(); 
        this.similarityCache = new Map<string, any>();
        this.isInitialized = false;
    }

    async init() {
        console.log("Initializing Advanced AI Music Recommendation Engine...");
        
        const songs = await Song.find({});
        for (const song of songs) {
            this.addSong(song._id.toString(), {
                title: song.title,
                artist: song.artist,
                tempo: song.tempo || 120,
                energy: song.energy || 0.5,
                valence: song.valence || 0.5,
                acousticness: song.acousticness || 0.5,
                danceability: song.danceability || 0.5,
                genre: song.genre || "Unknown"
            });
        }
        
        const users = await User.find({});
        
        // Fetch all history at once to prevent N+1 queries during startup
        const allHistory = await PlayHistory.find({});
        const historyByUser = new Map();
        for (const h of allHistory) {
            const uid = h.userId;
            if (!historyByUser.has(uid)) {
                historyByUser.set(uid, []);
            }
            historyByUser.get(uid).push(h);
        }

        for (const user of users) {
            await this.recalculateUser(user.clerkId, historyByUser.get(user.clerkId) || []);
        }
        
        this.isInitialized = true;
        console.log(`Advanced Engine Initialized. Loaded ${this.songCatalog.size} songs and ${this.users.size} users.`);
    }

    addSong(id, features) {
        // Normalize tempo to 0-1 (assuming 60 to 200 BPM range)
        const normTempo = Math.max(0, Math.min(1, (features.tempo - 60) / 140));
        this.songCatalog.set(id, { ...features, normTempo, macroCluster: mapToMacroCluster(features.genre) });
    }

    async recalculateUser(userId, precomputedHistory = null) {
        const history = precomputedHistory !== null ? precomputedHistory : await PlayHistory.find({ userId });
        
        const playCounts = new Map();
        let morning = 0, afternoon = 0, evening = 0, night = 0;
        
        for (const h of history) {
            const sid = h.songId.toString();
            playCounts.set(sid, (playCounts.get(sid) || 0) + 1);
            
            const hour = new Date(h.playedAt).getHours();
            if (hour >= 6 && hour < 12) morning++;
            else if (hour >= 12 && hour < 18) afternoon++;
            else if (hour >= 18 && hour < 24) evening++;
            else night++;
        }

        let maxTime = Math.max(morning, afternoon, evening, night);
        let preferredTime = "Night";
        if (maxTime === 0) preferredTime = "Unknown";
        else if (maxTime === morning) preferredTime = "Morning";
        else if (maxTime === afternoon) preferredTime = "Afternoon";
        else if (maxTime === evening) preferredTime = "Evening";

        const formattedHistory = Array.from(playCounts.entries()).map(([songId, playCount]) => ({
            songId,
            playCount
        }));

        const profile = this.precomputeUserProfile({
            history: formattedHistory,
            preferredTime,
            behavior: { skipRate: 0.1, avgListenTime: 180 }
        });
        
        this.users.set(userId, profile);
        this.similarityCache.clear();
    }

    recordPlay(userId, songId) {
        this.similarityCache.clear();
        this.recalculateUser(userId).catch(console.error);
    }

    precomputeUserProfile(data) {
        const history = data.history || [];
        if (history.length === 0) return { isNewUser: true, data };

        let audioSum = { tempo: 0, energy: 0, valence: 0, acousticness: 0, danceability: 0 };
        const genreCounts = new Map();
        const artistCounts = new Map();
        const songMap = new Map(); 
        let totalWeight = 0;

        for (const listen of history) {
            const song = this.songCatalog.get(listen.songId);
            if (!song) continue;
            
            songMap.set(listen.songId, listen.playCount);
            const weight = listen.playCount;
            totalWeight += weight;
            
            audioSum.tempo += song.normTempo * weight;
            audioSum.energy += song.energy * weight;
            audioSum.valence += song.valence * weight;
            audioSum.acousticness += song.acousticness * weight;
            audioSum.danceability += song.danceability * weight;
            
            genreCounts.set(song.macroCluster, (genreCounts.get(song.macroCluster) || 0) + weight);
            artistCounts.set(song.artist, (artistCounts.get(song.artist) || 0) + weight);
        }
        
        if (totalWeight === 0) return { isNewUser: true, data };

        const normalizeMap = (map) => {
            const obj = {};
            for (let [k, v] of map) obj[k] = v / totalWeight;
            return obj;
        };

        return {
            isNewUser: false,
            songMap, 
            totalPlays: totalWeight,
            audioVector: {
                tempo: audioSum.tempo / totalWeight,
                energy: audioSum.energy / totalWeight,
                valence: audioSum.valence / totalWeight,
                acousticness: audioSum.acousticness / totalWeight,
                danceability: audioSum.danceability / totalWeight
            },
            genres: normalizeMap(genreCounts),
            rawGenres: genreCounts, 
            artists: normalizeMap(artistCounts),
            rawArtists: artistCounts, 
            preferredTime: data.preferredTime || "Unknown",
            behavior: data.behavior || { skipRate: 0, avgListenTime: 180 }
        };
    }

    calculateSimilarity(userA, userB) {
        if (userA.isNewUser || userB.isNewUser) return { score: 0, details: null };

        // 1. GENRE OVERLAP (weight: 0.30)
        let intersectionG = 0;
        let unionG = 0;
        const allGenres = new Set([...Object.keys(userA.genres), ...Object.keys(userB.genres)]);
        for (const g of allGenres) {
            const a = userA.genres[g] || 0;
            const b = userB.genres[g] || 0;
            intersectionG += Math.min(a, b);
            unionG += Math.max(a, b);
        }
        let genreOverlap = unionG === 0 ? 0 : intersectionG / unionG;

        // 2. AUDIO FEATURE COSINE SIMILARITY (weight: 0.25)
        // Weight valence and energy 2x
        const audioWeights = { tempo: 1, energy: 2, valence: 2, acousticness: 1, danceability: 1 };
        const audioSim = cosineSimilarity(userA.audioVector, userB.audioVector, audioWeights);

        // 3. MOOD / VALENCE ALIGNMENT (weight: 0.20)
        const qA = getMoodQuadrant(userA.audioVector.valence, userA.audioVector.energy);
        const qB = getMoodQuadrant(userB.audioVector.valence, userB.audioVector.energy);
        const moodAlignment = getQuadrantSimilarity(qA, qB);

        // 4. ARTIST GRAPH OVERLAP (weight: 0.15) (Using weighted Jaccard proxy)
        let intersectionA = 0;
        let unionA = 0;
        const allArtists = new Set([...Object.keys(userA.artists), ...Object.keys(userB.artists)]);
        for (const art of allArtists) {
            const a = userA.artists[art] || 0;
            const b = userB.artists[art] || 0;
            intersectionA += Math.min(a, b);
            unionA += Math.max(a, b);
        }
        let artistOverlap = unionA === 0 ? 0 : intersectionA / unionA;
        // Boost artist overlap since it's hard to get exact matches
        artistOverlap = Math.min(1.0, artistOverlap * 2.5);

        // 5. TEMPORAL & CONTEXTUAL ALIGNMENT (weight: 0.10)
        let contextSync = 0.5; // Base
        if (userA.preferredTime === userB.preferredTime && userA.preferredTime !== "Unknown") {
            contextSync = 1.0;
        }

        // Calculate final score
        let finalScore = (
            (genreOverlap * 0.30) +
            (audioSim * 0.25) +
            (moodAlignment * 0.20) +
            (artistOverlap * 0.15) +
            (contextSync * 0.10)
        );

        // Convert to 0-100 scale
        let compatibilityScore = Math.round(finalScore * 100);

        // Grade mapping
        let grade = "D";
        if (compatibilityScore >= 90) grade = "S";
        else if (compatibilityScore >= 75) grade = "A";
        else if (compatibilityScore >= 60) grade = "B";
        else if (compatibilityScore >= 45) grade = "C";

        // Narrative Summary Generation
        let sharedGenres = [];
        for (const g of allGenres) {
            if (userA.genres[g] > 0.1 && userB.genres[g] > 0.1) sharedGenres.push(g);
        }
        
        let tensionPoints = [];
        if (moodAlignment === 0) tensionPoints.push("Opposing core moods (Happy/Sad vs Calm/Energetic)");
        if (audioSim < 0.5) tensionPoints.push("Differing sonic textures");
        if (contextSync === 0.5 && userA.preferredTime !== "Unknown") tensionPoints.push(`You listen in the ${userA.preferredTime}, they listen in the ${userB.preferredTime}`);

        let narrative = "";
        if (grade === "S" || grade === "A") {
            narrative = `A highly compatible match! You both naturally gravitate towards ${sharedGenres.length > 0 ? sharedGenres.join(" and ") : "similar sounds"}. `;
            if (moodAlignment === 1) narrative += `Your emotional listening profiles align perfectly in the ${qA} quadrant.`;
        } else if (grade === "B") {
            narrative = `A solid connection. You share a foundational appreciation for ${sharedGenres[0] || 'music'}, though your sonic textures diverge slightly.`;
        } else {
            narrative = `A complementary match. While your core tastes differ, this is a great opportunity to expand your boundaries.`;
            grade = "COMPLEMENTARY"; // Edge case mentioned in prompt
        }

        // Compile match details
        // Top Common Songs
        const songsA = new Set(userA.songMap.keys());
        const songsB = new Set(userB.songMap.keys());
        const commonSongsSet = new Set([...songsA].filter(x => songsB.has(x)));
        
        const commonSongsDetails = [];
        for (let songId of commonSongsSet) {
            const song = this.songCatalog.get(songId as string);
            commonSongsDetails.push({
                id: songId,
                title: song.title,
                artist: song.artist,
                playsA: userA.songMap.get(songId),
                playsB: userB.songMap.get(songId)
            });
        }
        commonSongsDetails.sort((a, b) => (b.playsA + b.playsB) - (a.playsA + a.playsB));

        // Output JSON format (wrapped in our matchDetails object for UI consumption)
        const matchDetails = {
            grade,
            compatibility_score: compatibilityScore,
            signal_breakdown: {
                genre_overlap: Number(genreOverlap.toFixed(2)),
                audio_similarity: Number(audioSim.toFixed(2)),
                mood_alignment: Number(moodAlignment.toFixed(2)),
                artist_graph: Number(artistOverlap.toFixed(2)),
                context_sync: Number(contextSync.toFixed(2))
            },
            shared_genres: sharedGenres,
            taste_tension_points: tensionPoints,
            narrative_summary: narrative,
            
            // Legacy UI properties required by frontend
            topSongs: commonSongsDetails.slice(0, 3),
            topArtists: Array.from(allArtists)
                .filter(a => userA.artists[a] && userB.artists[a])
                .map(name => ({ name, commonSongs: 1 }))
                .slice(0, 3),
            commonGenres: sharedGenres.map(g => ({ name: g, percentA: 50, percentB: 50 })), // Mocked for UI
            audioMatch: {
                energy: Math.round(userB.audioVector.energy * 100),
                tempo: Math.round(userB.audioVector.tempo * 100),
                valence: Math.round(userB.audioVector.valence * 100),
                acousticness: Math.round(userB.audioVector.acousticness * 100)
            },
            preferredTime: userB.preferredTime
        };

        return { score: compatibilityScore, details: matchDetails };
    }

    getSimilarUsers(targetId, topN = 10) {
        if (!this.isInitialized) {
            throw new Error("MusicRecommender not initialized");
        }
        
        const targetUser = this.users.get(targetId);
        if (!targetUser) return [];

        const results = [];
        
        for (let [userId, profile] of this.users.entries()) {
            if (userId === targetId) continue;
            
            const matchData = this.calculateSimilarity(targetUser, profile);
            
            // Note: Threshold filtering applied here
            if (matchData.score >= this.similarityThreshold) {
                results.push({ 
                    userId, 
                    score: Number(matchData.score),
                    matchDetails: matchData.details
                });
            }
        }

        return results.sort((a, b) => b.score - a.score).slice(0, topN);
    }
}

export const recommender = new MusicRecommender(20); 
