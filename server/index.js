const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const SpotifyWebApi = require("spotify-web-api-node");
const youtubeSearchApi = require("youtube-search-without-api-key");
const { MongoClient, Db } = require("mongodb");

const API_PORT = 3030;

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
if (!SPOTIFY_CLIENT_ID) throw Error("SPOTIFY_CLIENT_ID ENV UNDEFINED");

const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
if (!SPOTIFY_CLIENT_SECRET) throw Error("SPOTIFY_CLIENT_SECRET ENV UNDEFINED");

const MONGODB_URL = "mongodb://mongo:27017";

const USER_PLAYLISTS_DOC = "userPlaylists";
const PLAYLISTS_DOC = "playlists";
const SONGS_DOC = "songs";

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

const mongoClient = new MongoClient(MONGODB_URL);

/**
 * @type {Db}
 */
var db;

// helper method for stitching two arrays together. e.g. ([1,2,3], [a,b,c]) => [1,a,2,b,3,c]
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
  try {
    console.log("auth-with-code request incoming");
    const { authCode, redirectUri } = req.body;

    const spotifyWebApi = new SpotifyWebApi({
      redirectUri: redirectUri,
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
  } catch (e) {
    res.sendStatus(500);
  }
});

app.get("/search", async (req, res) => {
  try {
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
        return {
          title: video.title,
          artist: "Youtube", // ... flaw of the free API
          durationSeconds: 0, // todo.. flaw of free API
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
  } catch (e) {
    res.sendStatus(500);
  }
});

const getUsername = async (req) => {
  const spotifyWebApi = new SpotifyWebApi({
    clientId: SPOTIFY_CLIENT_ID,
    accessToken: req.body.spotifyAccessToken,
  });
  return (await spotifyWebApi.getMe()).body.id;
};

// USED API:
app.post("/add-my-playlist", async (req, res) => {
  try {
    const playlist = req.body.playlist;
    const TEST_USERNAME = "test7";

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
  } catch (e) {
    res.sendStatus(500);
  }
});

app.post("/init-playlist", async (req, res) => {
  try {
    const username = await getUsername(req);

    const { title, id } = req.body;

    const newPlaylist = {
      id: id,
      title: title,
      songs: [],
    };

    const userExists =
      (await db
        .collection(USER_PLAYLISTS_DOC)
        .findOne({ username: username })) != null;

    // first time user, init
    if (!userExists) {
      await db
        .collection(USER_PLAYLISTS_DOC)
        .insertOne({ username: username, playlists: [] });
    }

    // add playlist id to user's playlists
    await db.collection(USER_PLAYLISTS_DOC).updateOne({ username: username }, [
      {
        $set: {
          playlists: { $concatArrays: ["$playlists", [newPlaylist.id]] },
        },
      },
    ]);

    // add playlist to playlist docs
    await db.collection(PLAYLISTS_DOC).insertOne(newPlaylist);

    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  }
});

app.post("/add-song-to-playlist", async (req, res) => {
  try {
    const username = await getUsername(req);
    const { playlistId, song } = req.body;

    // check user owns playlist
    const userOwnsPlaylist = (
      await db.collection(USER_PLAYLISTS_DOC).findOne({ username: username })
    ).playlists.includes(playlistId);
    if (!userOwnsPlaylist) {
      res.sendStatus(403);
      return;
    }

    // TODO - check playlist exists

    // add songId to playlist doc songs
    await db.collection(PLAYLISTS_DOC).updateOne({ id: playlistId }, [
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
  } catch (e) {
    res.sendStatus(500);
  }
});

app.post("/delete-playlist", async (req, res) => {
  try {
    const username = await getUsername(req);
    const { playlistId } = req.body;

    // check user owns playlist
    const usersPlaylists = (
      await db.collection(USER_PLAYLISTS_DOC).findOne({ username: username })
    ).playlists;
    if (!usersPlaylists.includes(playlistId)) {
      res.sendStatus(403);
      return;
    }

    // remove playlist from userPlaylists doc
    await db.collection(USER_PLAYLISTS_DOC).updateOne({ username: username }, [
      {
        $set: {
          playlists: usersPlaylists.filter((pid) => pid !== playlistId),
        },
      },
    ]);

    // remove playlist from playlists doc
    await db.collection(PLAYLISTS_DOC).deleteOne({ id: playlistId });

    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  }
});

app.post("/delete-song-from-playlist", async (req, res) => {
  try {
    const username = await getUsername(req);
    const { playlistId, songUri } = req.body;

    // check user owns playlist
    const userOwnsPlaylist = (
      await db.collection(USER_PLAYLISTS_DOC).findOne({ username: username })
    ).playlists.includes(playlistId);
    if (!userOwnsPlaylist) {
      res.sendStatus(403);
      return;
    }

    // delete song from playlists doc
    const playlistSongs = (
      await db.collection(PLAYLISTS_DOC).findOne({ id: playlistId })
    ).songs;
    await db.collection(PLAYLISTS_DOC).updateOne({ id: playlistId }, [
      {
        $set: {
          songs: playlistSongs.filter(
            (playlistSong) => playlistSong !== songUri
          ),
        },
      },
    ]);

    res.sendStatus(200);
  } catch (e) {
    res.sendStatus(500);
  }
});

app.get("/get-my-playlists", async (req, res) => {
  try {
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
  } catch (e) {
    res.sendStatus(500);
  }
});

mongoClient.connect().then(() => {
  console.log("Connected to db");
  db = mongoClient.db("infs3208");
  app.listen(API_PORT);
});
