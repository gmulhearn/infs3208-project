import { Box, Button, makeStyles, Paper, Typography } from "@material-ui/core";
import React from "react";

const SPOTIFY_CLIENT_ID = "24ef7853deb14c51bd6f72e440f35fc1"; // TODO - process env
const SPOTIFY_RESPONSE_TYPE = "code";

const removeStringSuffix = (str: string, suffix: string): string => {
  if (str.endsWith(suffix)) return str.slice(0, str.length - 1);

  return str;
};

const SPOTIFY_REDIRECT_URL = `${removeStringSuffix(
  window.location.origin + window.location.pathname,
  "/"
)}`;

const SPOTIFY_AUTH_URL =
  `https://accounts.spotify.com/authorize` +
  `?client_id=${SPOTIFY_CLIENT_ID}` +
  `&response_type=${SPOTIFY_RESPONSE_TYPE}` +
  `&redirect_uri=${SPOTIFY_REDIRECT_URL}` +
  `&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state`;

interface Props {}

const useStyles = makeStyles((theme) => ({
  root: {
    margin: "auto",
    maxWidth: "50em",
    height: "70vh"
  },
  title: {
    margin: "1em",
    color: "white",
    fontSize: "5em",
    textShadow: "0 0 0.125em hsl(0 0% 100% / 0.9), 0 0 0.45em currentColor",
    zIndex: 10000
  },
  loginButton: {
    padding: "1em",
    color: "white",
    fontWeight: "bold",
    background: `linear-gradient(to right top, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
        // background: `linear-gradient(to right top, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
  },
  backdrop: {
    width: "1px",
    height: "1px",
    borderRadius: "50%",
    backgroundColor: "transparent",
    boxShadow:
      "-60px 60px 240px 260px rgba(255, 0, 255, 0.5)," + /* middle magenta */
      "60px -60px 240px 290px rgba(0, 255, 255, 0.5)" /* outer cyan */
  }
}));

const Login = (props: Props) => {
  const classes = useStyles();

  return (
    <Box
      className={classes.root}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <div>
        <Typography className={classes.title}>mixo</Typography>
      </div>
      <Button
        variant="contained"
        href={SPOTIFY_AUTH_URL}
        className={classes.loginButton}
      >
        Login With Spotify
      </Button>
      <div className={classes.backdrop}>

      </div>
    </Box>
  );
};

export default Login;
