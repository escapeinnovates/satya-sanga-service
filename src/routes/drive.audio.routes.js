const express = require("express");
const { getCache, setCache } = require("../utils/cache");
const {
    fetchAudioItems
} = require("../services/drive.audio.service");

const router = express.Router();


router.get("/audio-items", async (req, res) => {
  try {
    const { folderId } = req.query;

    if (!folderId) {
      return res.status(400).json({
        message: "folderId is required",
      });
    }

    const cacheKey = `drive:audio:${folderId}`;
    console.log("🎵 Audio cache key:", cacheKey);

    // 🔍 Cache check
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log("🔥 Audio cache HIT");
      return res.json({ files: cached });
    }

    console.log("🌐 Audio cache MISS → Google Drive");

    const files = await fetchAudioItems(folderId);

    // ⏱ Cache for 12 hours
    await setCache(cacheKey, files, 43200);

    res.json({ files });
  } catch (err) {
    console.error(
      "❌ Drive Audio API error:",
      err.response?.data || err.message
    );
    res.status(500).json({
      message: "Drive audio fetch failed",
      error: err.response?.data || err.message,
    });
  }
});

module.exports = router;