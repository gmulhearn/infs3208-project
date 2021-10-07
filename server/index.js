const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const SpotifyWebApi = require("spotify-web-api-node");
const youtubeSearchApi = require("youtube-search-without-api-key");
const { default: axios } = require("axios");
const { MongoClient, Db } = require("mongodb");

const API_PORT = 3030;

const YOUTUBE_API_KEY = "secrethere";
const SPOTIFY_CLIENT_ID = "24ef7853deb14c51bd6f72e440f35fc1";
const SPOTIFY_CLIENT_SECRET = "secrethere";
const SPOTIFY_API_REDIRECT_URL = "http://localhost:3000";

const MONGODB_URL = "mongodb://localhost:27017";

const USER_PLAYLISTS_DOC = "userPlaylists";
const PLAYLISTS_DOC = "playlists";
const SONGS_DOC = "songs";

//   curl \
//   'https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=ariana&key=[YOUR_API_KEY]' \
//   --header 'Authorization: Bearer [YOUR_ACCESS_TOKEN]' \
//   --header 'Accept: application/json' \
//   --compressed

// interface Song {
//     title: string,
//     artist: string,
//     durationSeconds: string,
//     coverArtURL: string,
//     type: "SPOTIFY"  ||  "YOUTUBE",
//     uri: string
// }

const app = express();
app.use(cors());
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));

const mongoClient = new MongoClient(MONGODB_URL);

/**
 * @type {Db}
 */
var db;

const youtubeAPISearch = async (query) => {
  const getURL = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${YOUTUBE_API_KEY}`;

  axios.get(getURL).then((res) => {
    console.log(res);
    console.log(res.data);
    console.log(JSON.stringify(res.data));
  });
};

const stitchArrays = (x, y) => {
  var arr = [];
  var length = Math.max(x.length, y.length);
  for (var i = 0; i < length; i++) {
    i < x.length && arr.push(x[i]);
    i < y.length && arr.push(y[i]);
  }

  return arr;
};

app.post("/auth-with-code", (req, res) => {
  console.log("auth-with-code request incoming");
  const authCode = req.body.authCode;

  const spotifyWebApi = new SpotifyWebApi({
    redirectUri: SPOTIFY_API_REDIRECT_URL,
    clientId: SPOTIFY_CLIENT_ID,
    clientSecret: SPOTIFY_CLIENT_SECRET,
  });

  spotifyWebApi
    .authorizationCodeGrant(authCode)
    .then((data) => {
      res.json({
        access_token: data.body.access_token,
        refresh_token: data.body.refresh_token,
        expires_in: data.body.expires_in,
      });
    })
    .catch((err) => {
      res.sendStatus(403);
    });
});

app.get("/search", async (req, res) => {
  console.log(req.query);
  const search = req.query.search;
  const searchFilters = JSON.parse(req.query.filters); // { youtubeResults: bool, spotifyResults: bool }
  const spotifyAccessToken = req.query.spotifyAccessToken;

  const spotifyWebApi = new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    accessToken: spotifyAccessToken,
  });

  try {
    const spotifyResults = (
      await spotifyWebApi.searchTracks(search, {
        limit: 10,
      })
    ).body.tracks.items;

    const youtubeResults = await (
      await youtubeSearchApi.search(search)
    ).slice(0, 10);

    const normalizedSpotifyResults = spotifyResults.map((track) => {
      return {
        title: track.name,
        artist: track.artists[0]?.name,
        durationSeconds: Math.floor(track.duration_ms / 1000),
        coverArtURL: track.album.images[0]?.url,
        type: "SPOTIFY",
        uri: track.uri,
      };
    });

    const normalizedYoutubeResults = youtubeResults.map((video) => {
      //   let durationComponents = video.snippet.duration.split(":");
      //   const durationSeconds =
      //     Number(durationComponents[durationComponents.length - 1]) +
      //     (durationComponents[durationComponents.length - 2]
      //       ? Number(durationComponents[durationComponents.length - 2]) * 60
      //       : 0) +
      //     (durationComponents[durationComponents.length - 3]
      //       ? Number(durationComponents[durationComponents.length - 3]) * 60 * 60
      //       : 0);
      return {
        title: video.title,
        artist: "Youtube", // TODO... flaw of the API
        durationSeconds: 0,
        coverArtURL: video.snippet.thumbnails.url,
        type: "YOUTUBE",
        uri: video.id.videoId,
      };
    });

    if (searchFilters.spotifyResults && searchFilters.youtubeResults) {
      res.json(
        stitchArrays(normalizedSpotifyResults, normalizedYoutubeResults)
      );
    } else if (searchFilters.spotifyResults) {
      res.json(normalizedSpotifyResults);
    } else if (searchFilters.youtubeResults) {
      res.json(normalizedYoutubeResults);
    } else {
      res.json([]);
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(403);
  }
});

const getUsername = async (req) => {
  const spotifyWebApi = new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    accessToken: req.body.spotifyAccessToken,
  });
  return (await spotifyWebApi.getMe()).body.id;
};

const TEST_USERNAME = "test7";

app.post("/add-my-playlist", async (req, res) => {
  // const playlist = {
  //   id: "1234-1234-1234",
  //   title: "test",
  //   songs: [
  //     {
  //       title: "songTitle",
  //       artist: "songArtist",
  //       durationSeconds: 123,
  //       coverArtURL: "string",
  //       type: "SPOTIFY",
  //       uri: "string:string:123",
  //     },
  //   ],
  // };

  const playlist = req.body.playlist;

  const usersPlaylists = await db
    .collection(USER_PLAYLISTS_DOC)
    .find({ username: TEST_USERNAME })
    .toArray();

  //------add Playlist to userPlaylists
  if (usersPlaylists.length === 0) {
    await db
      .collection(USER_PLAYLISTS_DOC)
      .insertOne({ username: TEST_USERNAME, playlists: [] });
  }
  await db
    .collection(USER_PLAYLISTS_DOC)
    .updateOne({ username: TEST_USERNAME }, [
      {
        $set: { playlists: { $concatArrays: ["$playlists", [playlist.id]] } },
      },
    ]);

  //--------- add Playlist to playlists
  const songIds = playlist.songs.map((song) => song.uri);

  const existingPlaylists = await db
    .collection(PLAYLISTS_DOC)
    .find({ id: playlist.id })
    .toArray();
  if (existingPlaylists.length > 0) {
    //ERROR!
  }
  await db
    .collection(PLAYLISTS_DOC)
    .insertOne({ id: playlist.id, title: playlist.title, songs: songIds });

  //----- add songs
  playlist.songs.forEach(async (song) => {
    const existingSong = await db
      .collection(SONGS_DOC)
      .find({ uri: song.uri })
      .toArray();
    if (existingSong.length === 0) {
      await db.collection(SONGS_DOC).insertOne(song);
    }
  });

  res.json([]);
});

app.post("/init-playlist", async (req, res) => {
  const username = await getUsername(req);

  const { title, id } = req.body;

  const newPlaylist = {
    id: id,
    title: title,
    songs: [],
  };

  const userExists =
    (await db.collection(USER_PLAYLISTS_DOC).findOne({ username: username })) !=
    null;

  // first time user, init
  if (!userExists) {
    await db
      .collection(USER_PLAYLISTS_DOC)
      .insertOne({ username: username, playlists: [] });
  }

  // add playlist id to user's playlists
  await db.collection(USER_PLAYLISTS_DOC).updateOne({ username: username }, [
    {
      $set: { playlists: { $concatArrays: ["$playlists", [newPlaylist.id]] } },
    },
  ]);

  // add playlist to playlist docs
  await db.collection(PLAYLISTS_DOC).insertOne(newPlaylist);

  res.sendStatus(200);
});

app.post("/add-song-to-playlist", async (req, res) => {
  const username = await getUsername(req);
  const { id, song } = req.body;

  // check user owns playlist
  const userOwnsPlaylist = (
    await db.collection(USER_PLAYLISTS_DOC).findOne({ username: username })
  ).playlists.includes(id);
  if (!userOwnsPlaylist) {
    res.sendStatus(403);
    return;
  }

  // TODO - check playlist exists

  // add songId to playlist doc songs
  await db.collection(PLAYLISTS_DOC).updateOne({ id: id }, [
    {
      $set: { songs: { $concatArrays: ["$songs", [song.uri]] } },
    },
  ]);

  // if song exists, no need to readd
  const songExists =
    (await db.collection(SONGS_DOC).findOne({ uri: song.uri })) != null;
  if (songExists) {
    res.sendStatus(200);
    return;
  }

  // add song to songs doc
  await db.collection(SONGS_DOC).insertOne(song);

  res.sendStatus(200);
});

app.get("/get-my-playlists", async (req, res) => {
  const spotifyWebApi = new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    accessToken: req.query.spotifyAccessToken,
  });
  const username = (await spotifyWebApi.getMe()).body.id;

  const userPlaylists = await db
    .collection(USER_PLAYLISTS_DOC)
    .findOne({ username: username });

  if (!userPlaylists) {
    res.json([]);
    return;
  }

  const playlists = await Promise.all(
    userPlaylists.playlists.map(async (playlistId) => {
      const playlistDoc = await db
        .collection(PLAYLISTS_DOC)
        .findOne({ id: playlistId });

      const songs = await Promise.all(
        playlistDoc.songs.map(async (songUri) => {
          return await db.collection(SONGS_DOC).findOne({ uri: songUri });
        })
      );

      return {
        id: playlistId,
        title: playlistDoc.title,
        songs: songs,
      };
    })
  );

  res.json(playlists);
});

mongoClient.connect().then(() => {
  db = mongoClient.db("infs3208");
  app.listen(API_PORT);
});
