// const axios = require("axios");
// const { GOOGLE_API_KEY } = require("../config/env");

// // 1. Fetch playlists of a channel
// exports.fetchPlaylists = async (channelId) => {

  //   const res = await axios.get(
  //     "https://www.googleapis.com/youtube/v3/playlists",
  //     {
  //       params: {
  //         key: GOOGLE_API_KEY,
  //         part: "snippet,contentDetails",
  //         channelId,
  //         maxResults: 50,
  //       },
  //     }
  //   );

  //   return res.data;
  // };

// // 2. Fetch videos of a playlist
// exports.fetchPlaylistVideos = async (playlistId) => {
//   const res = await axios.get(
//     "https://www.googleapis.com/youtube/v3/playlistItems",
//     {
//       params: {
//         key: GOOGLE_API_KEY,
//         part: "snippet",
//         playlistId,
//         maxResults: 50,
//       },
//     }
//   );
//   return res.data;
// };


const axios = require("axios");
const { GOOGLE_API_KEY, CHANNEL_ID } = require("../config/env");

const API = "https://www.googleapis.com/youtube/v3";

/* ======================================================
   FETCH ALL PLAYLISTS (WITH PAGINATION)
====================================================== */

exports.fetchPlaylists = async () => {

  let playlists = [];
  let pageToken = null;

  do {
    console.log('fetching playlists with pageToken:', pageToken);

    const res = await axios.get(`${API}/playlists`, {
      params: {
        key: GOOGLE_API_KEY,
        part: "snippet,contentDetails",
        channelId: CHANNEL_ID,
        maxResults: 50, 
        pageToken
      },
    });


    playlists.push(...res.data.items);
    pageToken = res.data.nextPageToken;

  } while (pageToken);

  return playlists;
};


/* ======================================================
   FETCH ALL VIDEOS FROM PLAYLIST
====================================================== */

exports.fetchPlaylistVideos = async (playlistId) => {

  let videos = [];
  let pageToken = null;

  do {

    const res = await axios.get(`${API}/playlistItems`, {
      params: {
        key: GOOGLE_API_KEY,
        part: "snippet",
        playlistId,
        maxResults: 50,
        pageToken
      }
    });

    const mapped = res.data.items.map(v => ({
      youtube_video_id: v.snippet.resourceId.videoId,
      title: v.snippet.title,
      description: v.snippet.description || null,
      thumbnail_url:
        v.snippet.thumbnails?.high?.url ||
        v.snippet.thumbnails?.default?.url,
      duration: null,
      published_at: v.snippet.publishedAt
    }));

    videos.push(...mapped);

    pageToken = res.data.nextPageToken;

  } while (pageToken);

  return videos;
};