import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  makeStyles,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@material-ui/core";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import axios from "axios";
import React, { useEffect, useState } from "react";
import SpotifyPlayer from "react-spotify-web-playback";
import spotifyLogo from "../spotifylogo.png";
import youtubeLogo from "../youtubelogo.png";
import YouTube, { Options } from "react-youtube";
import { Pause, SkipPrevious, SkipNext, Add, Close } from "@material-ui/icons";
import { v4 as uuidv4 } from "uuid";

const AUTH_SERVER_BASE_URL = "http://localhost:3030";
const SPOTIFY_CLIENT_ID = "24ef7853deb14c51bd6f72e440f35fc1";

interface SpotifyAuthServerResponse {
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: string;
  };
}

interface SearchFilters {
  youtubeResults: Boolean;
  spotifyResults: Boolean;
}

enum SongType {
  SPOTIFY = "SPOTIFY",
  YOUTUBE = "YOUTUBE",
}

interface Song {
  title: string;
  artist: string;
  durationSeconds: string;
  coverArtURL: string;
  type: SongType;
  uri: string;
}

interface Playlist {
  id: string;
  title: string;
  songs: Song[];
}

const useStyles = makeStyles((theme) => ({
  root: {
    maxWidth: "100em",
    marginTop: "3em",
    margin: "auto",
  },
  title: {
    margin: "1em",
    textAlign: "center",
  },
  paper: {
    padding: theme.spacing(4),
    margin: theme.spacing(3),
  },
  songItemPaper: {
    padding: theme.spacing(2),
    margin: theme.spacing(1),
    minHeight: "9em",
  },
  songSearchDropdown: {
    maxHeight: 300,
    overflow: "auto",
    position: "absolute",
    maxWidth: "50em",
    margin: "auto",
    top: "7.5em",
    backgroundColor: "#191919",
    zIndex: 10000,
  },
  playlistSongList: {
    maxWidth: "80em",
    marginBottom: "10em",
  },
  coverArt: {
    margin: theme.spacing(1),
    width: "4em",
    height: "4em",
  },
  platformLogo: {
    width: "1.5em",
    height: "1.5em",
  },
  playerBox: {
    backgroundColor: "#121212",
    position: "fixed",
    width: "100%",
    bottom: "0",
    zIndex: 10000,
    // minHeight: "100px",
  },
  playlistsSideBar: {
    minWidth: "15em",
  },
}));

const PlaylistSideBar = ({
  playlists,
  createPlaylist,
  setCurrentPlaylist,
}: {
  playlists: Playlist[];
  createPlaylist: (playlist: Playlist) => void;
  setCurrentPlaylist: (playlist: Playlist) => void;
}) => {
  const classes = useStyles();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [playlistPendingDeletion, setPlaylistPendingDeletion] =
    useState<Playlist | undefined>(undefined);
  const [playlistNameInput, setPlaylistNameInput] = useState("");

  const handleCreatePlaylist = () => {
    createPlaylist({ id: uuidv4(), title: playlistNameInput, songs: [] });
    setPlaylistNameInput("");
    setCreateDialogOpen(false);
  };

  const handleDeletePlaylist = () => {
    console.log(`deleting ${playlistPendingDeletion?.title}...`);
    //...
    setPlaylistPendingDeletion(undefined)
  };

  return (
    <Drawer variant="permanent" className={classes.playlistsSideBar}>
      <Dialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
        }}
        className={classes.paper}
      >
        <DialogTitle>New Playlist:</DialogTitle>
        <Box
          display="flex"
          flexDirection="column"
          alignContent="center"
          style={{ margin: "1em" }}
        >
          <TextField
            placeholder="Playlist Name..."
            variant="outlined"
            value={playlistNameInput}
            onChange={(e) => {
              setPlaylistNameInput(e.target.value);
            }}
          />
          <Button
            color="primary"
            variant="contained"
            fullWidth
            style={{ marginTop: "1em" }}
            onClick={handleCreatePlaylist}
          >
            Create Playlist
          </Button>
        </Box>
      </Dialog>

      <Dialog
        open={playlistPendingDeletion != undefined}
        onClose={() => {
          setPlaylistPendingDeletion(undefined);
        }}
        className={classes.paper}
      >
        <DialogTitle>
          Are you sure you wish to delete "{playlistPendingDeletion?.title}"?
        </DialogTitle>
        <Box
          display="flex"
          flexDirection="column"
          alignContent="center"
          style={{ margin: "1em" }}
        >
          <Button
            color="primary"
            variant="contained"
            fullWidth
            style={{ marginTop: "1em" }}
            onClick={handleDeletePlaylist}
          >
            Delete
          </Button>
        </Box>
      </Dialog>

      <Box className={classes.playlistsSideBar}>
        <Typography style={{ margin: "1em" }} variant="h5">
          Playlists
        </Typography>
        <Divider />

        <List>
          {playlists.map((playlist, index) => (
            <ListItem
              button
              key={playlist.title}
              onClick={() => {
                setCurrentPlaylist(playlist);
              }}
            >
              <ListItemText primary={playlist.title} />
              <ListItemSecondaryAction>
                <IconButton
                  onClick={() => {
                    setPlaylistPendingDeletion(playlist);
                  }}
                >
                  <Close />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
        <Divider />
        <ListItem
          button
          onClick={() => {
            setCreateDialogOpen(true);
          }}
        >
          <ListItemIcon>
            <Add />
          </ListItemIcon>
          <ListItemText>New Playlist</ListItemText>
        </ListItem>
      </Box>
    </Drawer>
  );
};

const PlaylistView = ({
  playlist,
  playingSong,
  playSong,
}: {
  playlist: Playlist;
  playingSong?: Song;
  playSong: (song: Song, positionInPlaylist?: number) => void;
}) => {
  const classes = useStyles();

  const handlePlaySong = (song: Song, songIndex: number) => {
    playSong(song, songIndex);
  };
  return (
    <Box
      display="flex"
      flexDirection="column"
      style={{ maxWidth: "60em", margin: "auto", marginTop: "1em" }}
    >
      <Typography variant="h4">{playlist.title}</Typography>
      <Box
        display="flex"
        flexDirection="column"
        className={classes.playlistSongList}
      >
        {playlist.songs.map((song, i) => (
          <SongItemPaper
            song={song}
            outline={playingSong && song.uri == playingSong.uri}
            playSong={(song) => {
              handlePlaySong(song, i);
            }}
            style={{ minWidth: "55em" }}
          />
        ))}
      </Box>
    </Box>
  );
};

const SongItemPaper = ({
  song,
  style,
  outline,
  playSong,
  addSongToCurrentPlaylist,
}: {
  song: Song;
  style?: React.CSSProperties;
  outline?: boolean;
  playSong: (song: Song) => void;
  addSongToCurrentPlaylist?: (song: Song) => void;
}) => {
  const classes = useStyles();

  let modifiedStyle = style;
  if (modifiedStyle) {
    if (outline) {
      modifiedStyle.border = "1px solid green";
      modifiedStyle.boxShadow = "0px 0px 5px 1px #0ff";
    }
  }

  return (
    <Paper className={classes.songItemPaper} style={modifiedStyle}>
      <Box display="flex" flexDirection="row" justifyContent="space-between">
        <Box display="flex" flexDirection="column">
          <Typography style={{ fontWeight: "bold" }}>{song.title}</Typography>
          <Typography>{song.artist}</Typography>
          {/* <Typography>{song.durationSeconds} seconds</Typography> */}
          {song.type == SongType.SPOTIFY ? (
            <img
              src={spotifyLogo}
              className={classes.platformLogo}
              style={{ marginTop: "1em" }}
            />
          ) : (
            <img
              src={youtubeLogo}
              className={classes.platformLogo}
              style={{ marginTop: "1em" }}
            />
          )}
        </Box>
        <Box
          display="flex"
          flexDirection="row"
          style={{ position: "relative" }}
          alignItems="center"
        >
          <Avatar
            src={song.coverArtURL}
            className={classes.coverArt}
            variant="rounded"
          />
          <IconButton
            style={{
              position: "absolute",
              right: addSongToCurrentPlaylist ? "2em" : "1em",
              top: "1em",
            }}
            onClick={() => {
              playSong(song);
            }}
          >
            <PlayArrowIcon />
          </IconButton>
          {addSongToCurrentPlaylist ? (
            <IconButton
              style={{ maxHeight: "1em", maxWidth: "1em" }}
              onClick={() => {
                addSongToCurrentPlaylist(song);
              }}
            >
              <Add />
            </IconButton>
          ) : (
            <></>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

const SongSearch = ({
  accessToken,
  playSong,
  addSongToCurrentPlaylist,
}: {
  accessToken: string | undefined;
  playSong: (song: Song) => void;
  addSongToCurrentPlaylist: (song: Song) => void;
}) => {
  const classes = useStyles();

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [includeYoutube, setIncludeYoutube] = useState(true);
  const [includeSpotify, setIncludeSpotify] = useState(true);
  const [hideResults, setHideResults] = useState(true);

  const handleSearchClicked = () => {
    if (accessToken) {
      const filters: SearchFilters = {
        youtubeResults: includeYoutube,
        spotifyResults: includeSpotify,
      };

      console.log({
        search: searchQuery,
        spotifyAccessToken: accessToken,
        filters: filters,
      });

      axios
        .get(`${AUTH_SERVER_BASE_URL}/search`, {
          params: {
            search: searchQuery,
            spotifyAccessToken: accessToken,
            filters: filters,
          },
        })
        .then((res) => {
          console.log(res);
          console.log(JSON.stringify(res));
          setSearchResults(res.data as Song[]);
          setHideResults(false);
        });
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      style={{ maxWidth: "50em", margin: "auto" }}
    >
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        style={{ width: "100%" }}
      >
        <TextField
          placeholder="Search for a song..."
          variant="outlined"
          fullWidth
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Box display="flex" flexDirection="row" style={{ marginLeft: "2em" }}>
          <Box display="flex" flexDirection="column" alignItems="center">
            <img src={spotifyLogo} className={classes.platformLogo} />

            <Switch
              checked={includeSpotify}
              onChange={() => setIncludeSpotify(!includeSpotify)}
            />
          </Box>
          <Box display="flex" flexDirection="column" alignItems="center">
            <img src={youtubeLogo} className={classes.platformLogo} />

            <Switch
              checked={includeYoutube}
              onChange={() => setIncludeYoutube(!includeYoutube)}
            />
          </Box>
        </Box>
        <Button
          color="primary"
          onClick={handleSearchClicked}
          style={{ marginLeft: "2em", paddingInline: "2em", height: "3em" }}
          variant="contained"
        >
          Search
        </Button>
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        className={classes.songSearchDropdown}
      >
        {hideResults ? (
          <></>
        ) : (
          <>
            {searchResults.length > 0 ? (
              <Button
                onClick={() => {
                  setHideResults(true);
                }}
              >
                Hide Results
              </Button>
            ) : (
              <div> </div>
            )}
            {searchResults.map((song) => (
              <SongItemPaper
                song={song}
                playSong={playSong}
                addSongToCurrentPlaylist={addSongToCurrentPlaylist}
              />
            ))}
          </>
        )}
      </Box>
    </Box>
  );
};

const PlayerFooter = ({
  song,
  playNextSong,
  playPreviousSong,
  spotifyAccessToken,
}: {
  song: Song | undefined;
  playNextSong: () => void;
  playPreviousSong: () => void;
  spotifyAccessToken: string | undefined;
}) => {
  const classes = useStyles();
  const [isReady, setIsReady] = useState(false);
  const [isYoutubeSong, setIsYoutubeSong] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [youtubePlayerTarget, setYoutubePlayerTarget] =
    useState<any | undefined>(undefined);

  useEffect(() => {
    if (song) {
      setIsYoutubeSong(song.type == SongType.YOUTUBE);
      setIsPlaying(true);
    }
  }, [song]);

  const opts: Options = {
    height: "1",
    width: "1",
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      autoplay: 1,
    },
  };

  const handlePlayButtonClick = () => {
    if (song) {
      if (isYoutubeSong && youtubePlayerTarget) {
        if (isPlaying) {
          youtubePlayerTarget.pauseVideo();
        } else {
          youtubePlayerTarget.playVideo();
        }
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkipButtonClick = () => {
    playNextSong();
  };

  const handlePreviousButtonClick = () => {
    playPreviousSong();
  };

  return (
    <Box className={classes.playerBox} display="flex" flexDirection="row">
      {song && isYoutubeSong ? (
        <YouTube
          videoId={song.uri}
          opts={opts}
          onReady={(e) => {
            setYoutubePlayerTarget(e.target);
          }}
        />
      ) : song && spotifyAccessToken ? (
        <div style={{ display: "none" }}>
          <SpotifyPlayer
            token={spotifyAccessToken}
            uris={[song.uri]}
            play={isPlaying}
          />
        </div>
      ) : (
        <div></div>
      )}

      {song ? (
        <Box
          display="flex"
          flexDirection="row"
          alignContent="center"
          style={{ maxWidth: "35%" }}
        >
          <Avatar
            src={song.coverArtURL}
            className={classes.coverArt}
            variant="rounded"
          />
          <Box display="flex" flexDirection="column" justifyContent="center">
            <Typography style={{ fontWeight: "bold" }}>{song.title}</Typography>
            <Typography>{song.artist}</Typography>
          </Box>
        </Box>
      ) : (
        <div></div>
      )}

      <Box
        display="flex"
        flexDirection="row"
        justifyContent="center"
        alignContent="center"
        style={{ position: "absolute", margin: "auto", right: "43%" }}
      >
        <IconButton
          style={{ marginTop: "0.5em", marginBottom: "0.5em" }}
          onClick={handlePreviousButtonClick}
        >
          <SkipPrevious fontSize="large" />
        </IconButton>
        <IconButton style={{ margin: "0.5em" }} onClick={handlePlayButtonClick}>
          {isPlaying ? (
            <Pause fontSize="large" />
          ) : (
            <PlayArrowIcon fontSize="large" />
          )}
        </IconButton>

        <IconButton
          style={{ marginTop: "0.5em", marginBottom: "0.5em" }}
          onClick={handleSkipButtonClick}
        >
          <SkipNext fontSize="large" />
        </IconButton>
      </Box>
    </Box>
  );
};

const Home = ({ authCode }: { authCode: string }) => {
  const classes = useStyles();
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [playingSong, setPlayingSong] = useState<Song | undefined>();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] =
    useState<Playlist | undefined>();
  const [positionInCurrentPlaylist, setPositionInCurrentPlaylist] =
    useState<number | undefined>(undefined);

  useEffect(() => {
    axios
      .post(`${AUTH_SERVER_BASE_URL}/auth-with-code`, {
        authCode: authCode,
      })
      .then((response: any) => {
        let res = response as SpotifyAuthServerResponse;
        setAccessToken(res.data.access_token);
      });
  }, [authCode]);

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
    setPlaylists([...playlists, playlist]);

    axios.post(`${AUTH_SERVER_BASE_URL}/init-playlist`, {
      spotifyAccessToken: accessToken, // TODO - could be undefined...
      id: playlist.id,
      title: playlist.title,
    });
  };

  const addSongToCurrentPlaylist = (song: Song) => {
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
      spotifyAccessToken: accessToken, // TODO - could be undefined...
      id: currentPlaylist.id,
      song: song,
    });
  };

  return (
    <Box>
      <PlaylistSideBar
        playlists={playlists}
        createPlaylist={createPlaylist}
        setCurrentPlaylist={setCurrentPlaylist}
      />
      <Grid container justifyContent="center" className={classes.root}>
        <Grid item xs={12}>
          <SongSearch
            accessToken={accessToken}
            playSong={playSong}
            addSongToCurrentPlaylist={addSongToCurrentPlaylist}
          />
        </Grid>
        <Grid item xs={12}>
          {currentPlaylist ? (
            <PlaylistView
              playlist={currentPlaylist}
              playingSong={playingSong}
              playSong={playSong}
            />
          ) : (
            <>TODO</>
          )}
        </Grid>
      </Grid>
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
