export type songSchema=  {
  title: string;
  artist: string;
  primary_genre:string,
  external_ids: {
    isrc_id?: string;
    spotify_id?: string;
    yt_id?: string;
    fuzzy_id?: string; // System-generated ID
  };
  imageUrl: string;
  duration: number;
  audio_details?: {
    tempo?: number;
    energy?: number;
    valence?: number;
    acousticness?: number;
    danceability?: number;
  };
  artists?: string[]; // Array of ObjectIds as strings
  lyrics?: string | null;
  lyricsSource?: string | null;
  lyricsFetchedAt?: Date | null;
};

export type saveSongRequestSchema  = {
    title:string,
    artist:string,
    song_id:string,
    primary_genre:string,
    duration:string,
}