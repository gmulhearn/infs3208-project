import { Box, Button, makeStyles, Switch, TextField } from '@material-ui/core';
import axios from 'axios';
import React, { useState } from 'react'
import { Song, SearchFilters } from '../types';
import SongItemPaper from './SongItemPaper';
import spotifyLogo from "../spotifylogo.png";
import youtubeLogo from "../youtubelogo.png";

const AUTH_SERVER_BASE_URL = process.env.REACT_APP_AUTH_SERVER_BASE_URL;

const useStyles = makeStyles((theme) => ({
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

export default SongSearch
