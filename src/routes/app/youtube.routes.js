const express = require("express");
const {
  getPlaylists,
  getVideos
} = require("../../controller/app/youtube.controller");

const router = express.Router();

/* ===============================
   GET PLAYLISTS
=============================== */

router.get("/playlists", getPlaylists);

/* ===============================
   GET VIDEOS BY PLAYLIST
=============================== */

router.get("/videos", getVideos);

module.exports = router;