const express = require("express");
const { fetchShorts } = require("../services/shorts.service");
const { getCache, setCache } = require("../utils/cache");

const router = express.Router();

/**
 * ✅ GET /api/youtube/shorts
 * Query params:
 *   channelId (required)
 */
router.get("/shorts", async (req, res) => {
  try {
    const { channelId } = req.query;

    if (!channelId) {
      return res.status(400).json({
        message: "channelId is required",
      });
    }

    const cacheKey = `yt:shorts:${channelId}`;
    console.log("📱 Shorts cache key:", cacheKey);

    // 🔍 Cache check
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log("🔥 Shorts cache HIT");
      return res.json(cached);
    }

    console.log("🌐 Shorts cache MISS → YouTube API");

    const data = await fetchShorts(channelId);

    // ⏱ Cache for 12 hours
    await setCache(cacheKey, data, 43200);

    res.json(data);
  } catch (err) {
    console.error(
      "❌ Shorts API error:",
      err.response?.data || err.message
    );
    res.status(500).json({
      message: "YouTube Shorts fetch failed",
      error: err.response?.data || err.message,
    });
  }
});

module.exports = router;
