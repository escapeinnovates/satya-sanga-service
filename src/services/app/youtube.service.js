const worker = require("../admin/worker.service");

/* ===============================
   GET PLAYLISTS
=============================== */

exports.getPlaylists = async () => {

  const data = await worker.get("/app-youtube/playlists");

  return data?.items || [];

};


/* ===============================
   GET VIDEOS
=============================== */

exports.getVideos = async (playlistId) => {

  const data = await worker.get(`/app-youtube/videos?playlistId=${playlistId}`);

  return data?.items || [];

};