import {
  Box,
  Button,
  Grid,
  makeStyles,
  Switch,
  TextField,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
import axios from "axios";
import React, { useState } from "react";
import { Song, SearchFilters } from "../types";
import SongItemPaper from "./SongItemPaper";
import spotifyLogo from "../spotifylogo.png";
import youtubeLogo from "../youtubelogo.png";

const removeStringSuffix = (str: string, suffix: string): string => {
  if (str.endsWith(suffix)) return str.slice(0, str.length - 1);

  return str;
};

const AUTH_SERVER_BASE_URL = `${removeStringSuffix(
  window.location.origin + window.location.pathname,
  "/"
)}/api`;

const useStyles = makeStyles((theme) => ({
  songSearchDropdown: {
    maxHeight: 300,
    overflow: "auto",
    position: "absolute",
    maxWidth: "50em",
    margin: "auto",
    [theme.breakpoints.up('md')]: {
      top: "7.5em",
    },
    [theme.breakpoints.down('md')]: {
      top: "9.5em",
    },
    backgroundColor: "#191919",
    zIndex: 10000,
  },
  platformLogo: {
    width: "1.5em",
    height: "1.5em",
  },
}));

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

  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

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
      flexGrow={1}
      style={{margin: "auto", width: isMdUp ? "50%" : "90%" }}
    >
      <Grid container style={{ minWidth: "100%" }}>
        <Grid item xs={12} md={6}>
          <TextField
            placeholder="Search for a song..."
            variant="outlined"
            fullWidth
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <Box display="flex" flexDirection="row" justifyContent="center">
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
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth 
            color="primary"
            onClick={handleSearchClicked}
            style={{ paddingInline: "2em", height: "3.5em" }}
            variant="contained"
          >
            Search
          </Button>
        </Grid>
      </Grid>
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

export default SongSearch;
