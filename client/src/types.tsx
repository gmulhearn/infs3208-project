export interface SpotifyAuthServerResponse {
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: string;
  };
}

export interface SearchFilters {
  youtubeResults: Boolean;
  spotifyResults: Boolean;
}

export enum SongType {
  SPOTIFY = "SPOTIFY",
  YOUTUBE = "YOUTUBE",
}

export interface Song {
  title: string;
  artist: string;
  durationSeconds: string;
  coverArtURL: string;
  type: SongType;
  uri: string;
}

export interface Playlist {
  id: string;
  title: string;
  songs: Song[];
}