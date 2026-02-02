const axios = require("axios");
const { GOOGLE_API_KEY } = require("../config/env");

// 1. Fetch playlists of a channel
exports.fetchPlaylists = async (channelId) => {
    
  const res = await axios.get(
    "https://www.googleapis.com/youtube/v3/playlists",
    {
      params: {
        key: GOOGLE_API_KEY,
        part: "snippet,contentDetails",
        channelId,
        maxResults: 50,
      },
    }
  );
  
  return res.data;
};

// 2. Fetch videos of a playlist
exports.fetchPlaylistVideos = async (playlistId) => {
  const res = await axios.get(
    "https://www.googleapis.com/youtube/v3/playlistItems",
    {
      params: {
        key: GOOGLE_API_KEY,
        part: "snippet",
        playlistId,
        maxResults: 50,
      },
    }
  );
  return res.data;
};
