export interface Song {
	_id: string;
	title: string;
	artist: string;
	albumId: string | null;
	imageUrl: string;
	audioUrl: string;
	duration: number;
	createdAt: string;
	updatedAt: string;
	lyrics?: string;
	lyricsSource?: string;
	lyricsFetchedAt?: string;
}

export interface Album {
	_id: string;
	title: string;
	artist: string;
	imageUrl: string;
	releaseYear: number;
	songs: Song[];
}

export interface Stats {
	totalSongs: number;
	totalAlbums: number;
	totalUsers: number;
	totalArtists: number;
}

export interface Message {
	_id: string;
	senderId: string;
	receiverId: string;
	content: string;
	imageUrl?: string;
	voiceNoteUrl?: string;
	isRead?: boolean;
	replyTo?: { _id: string, content: string, senderId: string };
	reactions?: Record<string, string>;
	createdAt: string;
	updatedAt: string;
}

export interface MatchDetails {
	grade?: string;
	compatibility_score?: number;
	signal_breakdown?: {
		genre_overlap: number;
		audio_similarity: number;
		mood_alignment: number;
		artist_graph: number;
		context_sync: number;
	};
	shared_genres?: string[];
	taste_tension_points?: string[];
	narrative_summary?: string;
	
	topSongs: { id: string; title: string; artist: string; playsA: number; playsB: number }[];
	topArtists: { name: string; commonSongs: number }[];
	commonGenres: { name: string; percentA: number; percentB: number }[];
	audioMatch: {
		energy: number;
		tempo: number;
		valence: number;
		acousticness: number;
	};
	preferredTime?: string;
}

export interface User {
	_id: string;
	clerkId: string;
	fullName: string;
	username?: string;
	imageUrl: string;
	bio?: string;
	favoriteSong?: string;
	favoriteArtist?: string;
	friends?: string[];
	lastSeen?: string;
	lastMessage?: string;
	lastActivity?: string;
	isFriend?: boolean;
	isPending?: boolean;
	isSent?: boolean;
	mutualFriendsCount?: number;
	similarityScore?: number;
	matchDetails?: MatchDetails | null;
}

export interface Notification {
	_id: string;
	userId: string;
	senderId?: string;
	senderName?: string;
	senderAvatar?: string;
	type: "social" | "messages" | "music" | "ai" | "system";
	title: string;
	message: string;
	isRead: boolean;
	createdAt: string;
	updatedAt: string;
	metadata?: {
		matchPercentage?: number;
		sharedArtists?: string[];
		matchUserId?: string;

		playlistCoverUrl?: string;
		genreBadge?: string;
		playlistId?: string;

		songId?: string;
		songTitle?: string;
		songArtist?: string;
		songArtwork?: string;
		artistImage?: string;
		listeningStatus?: "playing" | "paused" | "listened";

		musicPersonality?: string;
		moodTrend?: string[];
		recommendations?: string[];
	};
}