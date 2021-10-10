import { Box, makeStyles, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import React from 'react'
import { Playlist, Song } from '../types';
import SongItemPaper from './SongItemPaper';

const useStyles = makeStyles((theme) => ({
    playlistSongList: {
      maxWidth: "80em",
      marginBottom: "10em",
    },
  }));
  
  const PlaylistView = ({
    playlist,
    playingSong,
    playSong,
    deleteSongFromPlaylist,
  }: {
    playlist: Playlist;
    playingSong?: Song;
    playSong: (song: Song, positionInPlaylist?: number) => void;
    deleteSongFromPlaylist: (song: Song, playlist: Playlist) => void;
  }) => {
    const classes = useStyles();

    const theme = useTheme();
    const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  
    const handlePlaySong = (song: Song, songIndex: number) => {
      playSong(song, songIndex);
    };
    return (
      <Box
        display="flex"
        flexDirection="column"
        style={{ margin: "auto", marginTop: "1em", width: isMdUp ? "50%" : "90%" }}
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
              style={{}}
              deleteSong={(song: Song) => deleteSongFromPlaylist(song, playlist)}
            />
          ))}
        </Box>
      </Box>
    );
  };

export default PlaylistView
