const youtubeService = require("../../services/app/youtube.service");

/* ===============================
   GET PLAYLISTS
=============================== */

exports.getPlaylists = async (req, res) => {

  try {

    const data = await youtubeService.getPlaylists();

    res.json({
      success: true,
      items: data
    });

  } catch (err) {

    console.error("YouTube Playlists Error:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch playlists"
    });

  }

};


/* ===============================
   GET VIDEOS BY PLAYLIST
=============================== */

exports.getVideos = async (req, res) => {

  try {

    
    const { playlistId } = req.query;

    if (!playlistId) {
      return res.status(400).json({
        success: false,
        message: "playlistId required"
      });
    }

    const data = await youtubeService.getVideos(playlistId);

    res.json({
      success: true,
      items: data
    });

  } catch (err) {

    console.error("YouTube Videos Error:", err.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch videos"
    });

  }

};