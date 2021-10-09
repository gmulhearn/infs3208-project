import { Box, Button, makeStyles, Paper, Typography } from "@material-ui/core";
import React from "react";

const SPOTIFY_CLIENT_ID =  "24ef7853deb14c51bd6f72e440f35fc1" // TODO - process env
const SPOTIFY_RESPONSE_TYPE = "code"
const SPOTIFY_REDIRECT_URL = window.location.origin
const SPOTIFY_AUTH_URL = 
    `https://accounts.spotify.com/authorize` +
    `?client_id=${SPOTIFY_CLIENT_ID}` +
    `&response_type=${SPOTIFY_RESPONSE_TYPE}` +
    `&redirect_uri=${SPOTIFY_REDIRECT_URL}` +
    `&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state`

interface Props {}

const useStyles = makeStyles((theme) => ({
  title: {
    margin: "1em",
    textAlign: "center",
  },
  loginPaper: {
    padding: theme.spacing(4),
    margin: "auto",
    maxWidth: "50em",
    marginTop: "10em"
  },
  paperTitle: {
    textAlign: "center",
  },
}));

const Login = (props: Props) => {
    const classes = useStyles();

  return (
    <Box>
        <Paper className={classes.loginPaper}>
            <Typography variant="h5" className={classes.paperTitle}>
                Login
            </Typography>
            <Button 
            fullWidth
            color="primary"
            variant="contained"
            href={SPOTIFY_AUTH_URL}
            >
                Login With Spotify
            </Button>
        </Paper>
    </Box>
    );
};

export default Login;
