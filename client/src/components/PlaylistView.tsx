import { Box, makeStyles, Typography } from '@material-ui/core';
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
              deleteSong={(song: Song) => deleteSongFromPlaylist(song, playlist)}
            />
          ))}
        </Box>
      </Box>
    );
  };

export default PlaylistView
