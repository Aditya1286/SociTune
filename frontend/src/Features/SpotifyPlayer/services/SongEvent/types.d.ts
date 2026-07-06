//For localhost
export type songAnalyzeInputType = {
  song_id: string; //can be isrc,spotify,yt,fuzzy,
  song_name: string;
  artist_name: string;
  genre_primary?: string;
  language?: string;
  explicit?: boolean;
  lyrics?: {
    full_text: String;
    excerpt: string;
    source: string;
    language_detected: string;
  };
  audio_features?: {
    bpm: number;
    energy: number;
    danceability: number;
    acousticness: number;
    instrumentalness: number;
    valence: number;
    loudness_db: number;
    key: number;
    mode: number;
    time_signature: number;
    duration_ms: number;
    liveness: number;
    speechiness: number;
    spectral_centroid: number;
    spectral_rolloff: number;
    zero_crossing_rate: number;
    mfcc: number;
    source: number;
  };
  source?: {
    system: string;
    version: string;
    trace_id: string;
    extra: string;
  };
  analysis_options?: {
    analysis_depth: string;
    include_embedding: boolean;
    language_override: string;
    model_version: string;
    force_refresh: boolean;
  };
};


export type songDetails = {
  title: string;
  artist: string;
  external_ids: {
    isrc_id?: string;
    spotify_id?: string;
    yt_id?: string; //Will not send fuzzy id from frontend , it'll be generated at backend
  };
  genre_primary: string;
  duration: string;
  audio_details?: {
    tempo: number;
    energy: number;
    valence: number;
    acousticness: number;
    danceability: number;
  };
  lyrics_details?: {
    lyrics: string ;
    lyricsSource: string ;
    lyricsFetchedAt: Date;
  };
  image_url: string;
};

export type songEventPayload = {
  song_details: songDetails;
  played_at: string;
  duration_ms: string;
  completed: boolean; //can be calculated
  session_id?: string;
  source?:
    | "organic"
    | "playlist"
    | "radio"
    | "search"
    | "recommendation"
    | "share"
    | "other";
};
