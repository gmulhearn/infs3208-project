import React, { useState } from 'react'
import { Playlist } from '../types';
import { v4 as uuidv4 } from "uuid";
import { Box, Button, Dialog, DialogTitle, Divider, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText, makeStyles, TextField, Typography } from '@material-ui/core';
import { Add, Close } from '@material-ui/icons';


const useStyles = makeStyles((theme) => ({
    dialog: {
      padding: theme.spacing(4),
      margin: theme.spacing(3),
    },
    playlistsSideBar: {
      minWidth: "15em",
    },
  }));

const PlaylistSideBar = ({
    playlists,
    createPlaylist,
    setCurrentPlaylist,
    deletePlaylist,
  }: {
    playlists: Playlist[];
    createPlaylist: (playlist: Playlist) => void;
    setCurrentPlaylist: (playlist: Playlist) => void;
    deletePlaylist: (playlist: Playlist) => void;
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
      if (playlistPendingDeletion) {
        console.log(`deleting ${playlistPendingDeletion?.title}...`);
        deletePlaylist(playlistPendingDeletion);
        setPlaylistPendingDeletion(undefined);
      }
    };
  
    return (
      <Drawer variant="permanent" className={classes.playlistsSideBar}>
        <Dialog
          open={createDialogOpen}
          onClose={() => {
            setCreateDialogOpen(false);
          }}
          className={classes.dialog}
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
          className={classes.dialog}
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

export default PlaylistSideBar
