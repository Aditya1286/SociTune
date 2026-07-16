export interface ExternalIds {
  spotify_id?: string;
  isrc_id?: string;
  yt_id?: string;
  fuzzy_id: string;
}

export interface AudioDetails {
  tempo?: number;
  energy?: number;
  valence?: number;
  acousticness?: number;
  danceability?: number;
}

export interface LyricsDetails {
  lyrics: string;
  lyricsSource: string;
  lyricsFetchedAt: string | Date;
}

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
	external_ids?: ExternalIds;
	audio_details?: AudioDetails;
	genre?: string;
	lyrics?: string;
	lyricsSource?: string;
	lyricsFetchedAt?: string;
}

export interface SongDetails {
  title: string;
  artist: string;
  external_ids: {
    isrc_id?: string;
    spotify_id?: string;
    yt_id?: string;
    fuzzy_id: string;
  };
  primary_genre: string;
  duration: string;
  audio_details?: {
    tempo: number;
    energy: number;
    valence: number;
    acousticness: number;
    danceability: number;
  };
  lyrics_details?: {
    lyrics: string;
    lyricsSource: string;
    lyricsFetchedAt: string | Date;
  };
  image_url: string;
}

export interface ListenEventMetaData {
  song_details: SongDetails;
  played_at: string;
  duration_ms: string;
  completed: boolean;
  session_id?: string;
  source?: "organic" | "playlist" | "radio" | "search" | "recommendation" | "share" | "other";
}

export interface ListeningEventPayload extends ListenEventMetaData {}

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
	displayName: string;
	username?: string;
	email?: string;
	spotify_user_id?: string;
	imageUrl: string;
	bio?: string;
	favoriteSong?: string;
	favoriteArtist?: string;
	friends?: string[];
	lastSeen?: string;
	lastMessage?: string;
	lastMessageAt?: string;
	lastActivity?: string;
	isFriend?: boolean;
	isPending?: boolean;
	isSent?: boolean;
	mutualFriendsCount?: number;
	similarityScore?: number;
	matchDetails?: MatchDetails | null;
	gender?: string;
	birthday?: string;
	country?: string;
	profileCompleted: boolean;
	uid: string;
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