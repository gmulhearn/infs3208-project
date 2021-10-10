import { AppBar, Box, Grid, makeStyles } from "@material-ui/core";
import axios from "axios";
import React, { useEffect, useState } from "react";
import PlaylistSideBar from "../components/PlaylistSideBar";
import { Song, Playlist, SpotifyAuthServerResponse } from "../types";
import PlaylistView from "../components/PlaylistView";
import SongSearch from "../components/SongSearch";
import PlayerFooter from "../components/PlayerFooter";

const removeStringSuffix = (str: string, suffix: string): string => {
  if (str.endsWith(suffix)) return str.slice(0, str.length - 1);

  return str;
};

const AUTH_SERVER_BASE_URL = `${removeStringSuffix(
  window.location.origin + window.location.pathname,
  "/"
)}/api`;

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: "100em",
    marginTop: "3em",
    margin: "auto",
  },
}));

const Home = ({
  authCode,
  initAccessToken,
}: {
  authCode?: string;
  initAccessToken?: string;
}) => {
  const classes = useStyles();
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [playingSong, setPlayingSong] = useState<Song | undefined>();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] =
    useState<Playlist | undefined>();
  const [positionInCurrentPlaylist, setPositionInCurrentPlaylist] =
    useState<number | undefined>(undefined);

  useEffect(() => {
    if (!authCode) return;
    axios
      .post(`${AUTH_SERVER_BASE_URL}/auth-with-code`, {
        authCode: authCode,
        redirectUri: window.location.origin,
      })
      .then((response: any) => {
        let res = response as SpotifyAuthServerResponse;
        setAccessToken(res.data.access_token);
        // todo refresh token

        window.history.pushState(
          {},
          "",
          `/?accessToken=${res.data.access_token}`
        );
      })
      .catch(() => {
        // back to login
        // window.location.href = "/";
      });
  }, [authCode]);

  useEffect(() => {
    if (!initAccessToken) return;
    if (accessToken) return;
    setAccessToken(initAccessToken);
  }, [initAccessToken]);

  useEffect(() => {
    if (!accessToken) return;
    axios
      .get(`${AUTH_SERVER_BASE_URL}/get-my-playlists`, {
        params: {
          spotifyAccessToken: accessToken,
        },
      })
      .then((res) => {
        console.log(res);
        setPlaylists(res.data);
      });
  }, [accessToken]);

  const playSong = (song: Song, positionInPlaylist?: number) => {
    setPlayingSong(song);

    if (positionInPlaylist !== undefined) {
      setPositionInCurrentPlaylist(positionInPlaylist);
    }
  };

  const playNextSong = () => {
    if (positionInCurrentPlaylist !== undefined && currentPlaylist) {
      let nextPositionInPlaylist =
        (positionInCurrentPlaylist + 1) % currentPlaylist.songs.length;
      let nextSong = currentPlaylist.songs[nextPositionInPlaylist];
      if (nextSong) {
        setPositionInCurrentPlaylist(nextPositionInPlaylist);
        setPlayingSong(nextSong);
      }
    }
  };

  const playPreviousSong = () => {
    if (positionInCurrentPlaylist !== undefined && currentPlaylist) {
      let nextPositionInPlaylist =
        (positionInCurrentPlaylist - 1) % currentPlaylist.songs.length;
      if (nextPositionInPlaylist === -1) {
        nextPositionInPlaylist = currentPlaylist.songs.length - 1;
      }
      let nextSong = currentPlaylist.songs[nextPositionInPlaylist];
      if (nextSong) {
        setPositionInCurrentPlaylist(nextPositionInPlaylist);
        setPlayingSong(nextSong);
      }
    }
  };

  const createPlaylist = (playlist: Playlist) => {
    if (!accessToken) return;

    setPlaylists([...playlists, playlist]);

    axios.post(`${AUTH_SERVER_BASE_URL}/init-playlist`, {
      spotifyAccessToken: accessToken,
      id: playlist.id,
      title: playlist.title,
    });
  };

  const addSongToCurrentPlaylist = (song: Song) => {
    if (!accessToken) return;

    // update current Playlist
    if (!currentPlaylist) return;
    let newCurrentPlaylist = {
      id: currentPlaylist.id,
      title: currentPlaylist.title,
      songs: [...currentPlaylist.songs, song],
    };
    setCurrentPlaylist(newCurrentPlaylist);

    // update all playlists
    const indexOfCurrentPlaylist = playlists.findIndex((playlist, i, _) => {
      return playlist.id == currentPlaylist.id;
    });
    if (indexOfCurrentPlaylist === -1) return; // should not occur
    let newPlaylists = playlists;
    newPlaylists[indexOfCurrentPlaylist] = newCurrentPlaylist;
    setPlaylists(newPlaylists);

    // add to db
    axios.post(`${AUTH_SERVER_BASE_URL}/add-song-to-playlist`, {
      spotifyAccessToken: accessToken,
      playlistId: currentPlaylist.id,
      song: song,
    });
  };

  const deletePlaylist = (playlist: Playlist) => {
    if (!accessToken) return;

    // potentially update currentPlaylist
    if (currentPlaylist && playlist.id === currentPlaylist.id) {
      setCurrentPlaylist(undefined);
    }

    // update playlists
    setPlaylists(playlists.filter((p) => p.id !== playlist.id));

    // update db
    axios.post(`${AUTH_SERVER_BASE_URL}/delete-playlist`, {
      spotifyAccessToken: accessToken,
      playlistId: playlist.id,
    });
  };

  const deleteSongFromPlaylist = (song: Song, playlist: Playlist) => {
    if (!accessToken) return;

    const updatedPlaylist: Playlist = {
      id: playlist.id,
      title: playlist.title,
      songs: playlist.songs.filter((s) => s.uri !== song.uri),
    };

    // potentially update currentPlaylist
    if (currentPlaylist && playlist.id === currentPlaylist.id) {
      setCurrentPlaylist(updatedPlaylist);
    }

    // update playlists
    setPlaylists(
      playlists.map((p) => {
        if (p.id === updatedPlaylist.id) {
          return updatedPlaylist;
        } else {
          return p;
        }
      })
    );

    // update db
    axios.post(`${AUTH_SERVER_BASE_URL}/delete-song-from-playlist`, {
      spotifyAccessToken: accessToken,
      playlistId: playlist.id,
      songUri: song.uri,
    });
  };

  return (
    <Box>
      <PlaylistSideBar
        playlists={playlists}
        createPlaylist={createPlaylist}
        setCurrentPlaylist={setCurrentPlaylist}
        deletePlaylist={deletePlaylist}
      />
      <Box display="flex" flexDirection="column" className={classes.root}>
        
          <SongSearch
            accessToken={accessToken}
            playSong={playSong}
            addSongToCurrentPlaylist={addSongToCurrentPlaylist}
          />
          {currentPlaylist ? (
            <PlaylistView
              playlist={currentPlaylist}
              playingSong={playingSong}
              playSong={playSong}
              deleteSongFromPlaylist={deleteSongFromPlaylist}
            />
          ) : (
            <></>
          )}
      </Box>
      <PlayerFooter
        song={playingSong}
        playNextSong={playNextSong}
        playPreviousSong={playPreviousSong}
        spotifyAccessToken={accessToken}
      />
    </Box>
  );
};

export default Home;
