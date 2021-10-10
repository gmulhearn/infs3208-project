import {
  Avatar,
  Box,
  IconButton,
  makeStyles,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@material-ui/core";
import { Add, Close } from "@material-ui/icons";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import React from "react";
import { Song, SongType } from "../types";
import spotifyLogo from "../spotifylogo.png";
import youtubeLogo from "../youtubelogo.png";

const useStyles = makeStyles((theme) => ({
  songItemPaper: {
    padding: theme.spacing(2),
    margin: theme.spacing(1),
    minHeight: "9em",
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
}));

const truncate = (str: string, n: number) => {
  return (str.length > n) ? str.substr(0, n-1) + '...' : str;
};

const SongItemPaper = ({
  song,
  style,
  outline,
  playSong,
  addSongToCurrentPlaylist,
  deleteSong,
}: {
  song: Song;
  style?: React.CSSProperties;
  outline?: boolean;
  playSong: (song: Song) => void;
  addSongToCurrentPlaylist?: (song: Song) => void;
  deleteSong?: (song: Song) => void;
}) => {
  const classes = useStyles();

  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));

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
          <Typography style={{ fontWeight: "bold" }}>{isMdUp ? song.title : truncate(song.title, 30)}</Typography>
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
              right: "2em",
              top: "25%",
            }}
            onClick={() => {
              playSong(song);
            }}
          >
            <PlayArrowIcon />
          </IconButton>
          {!deleteSong ? (
            <IconButton
              style={{ maxHeight: "1em", maxWidth: "1em" }}
              onClick={() => {
                if (addSongToCurrentPlaylist) {
                  addSongToCurrentPlaylist(song);
                }
              }}
            >
              <Add />
            </IconButton>
          ) : (
            <IconButton
              style={{ maxHeight: "1em", maxWidth: "1em" }}
              onClick={() => {
                if (deleteSong) {
                  deleteSong(song);
                }
              }}
            >
              <Close />
            </IconButton>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default SongItemPaper;
