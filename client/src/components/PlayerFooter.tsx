import {
  Avatar,
  Box,
  IconButton,
  makeStyles,
  Typography,
} from "@material-ui/core";
import { SkipPrevious, Pause, SkipNext } from "@material-ui/icons";
import React, { useEffect, useState } from "react";
import YouTube, { Options } from "react-youtube";
import { Song, SongType } from "../types";
import SpotifyPlayer from "react-spotify-web-playback";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";

const useStyles = makeStyles((theme) => ({
  coverArt: {
    margin: theme.spacing(1),
    width: "4em",
    height: "4em",
  },
  playerBox: {
    backgroundColor: "#121212",
    position: "fixed",
    width: "100%",
    bottom: "0",
    zIndex: 10000,
  },
}));

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

export default PlayerFooter;
