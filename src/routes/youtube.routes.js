const express = require("express");
const {
    fetchPlaylists,
    fetchPlaylistVideos,
} = require("../services/youtube.service");
const { getCache, setCache } = require("../utils/cache");

const router = express.Router();

// GET /api/youtube/playlists?channelId=XXX
router.get("/playlists", async (req, res) => {
    const { channelId } = req.query;

    const cacheKey = `yt:playlists:${channelId}`;

    const cached = await getCache(cacheKey);
    console.log('cache playlist');

    if (cached) return res.json(cached);

    const data = await fetchPlaylists(channelId);
    console.log('get playlist');
    await setCache(cacheKey, data, 43200); // 12 hours

    res.json(data);
});

// GET /api/youtube/playlist-videos?playlistId=XXX
router.get("/playlist-videos", async (req, res) => {
    const { playlistId } = req.query;

    const cacheKey = `yt:playlistVideos:${playlistId}`;
    console.log("CACHE KEY:", cacheKey);

    const cached = await getCache(cacheKey);
    console.log('cache playlist videos');
    if (cached) return res.json(cached); ``

    const data = await fetchPlaylistVideos(playlistId);
    console.log('get playlist videos');
    await setCache(cacheKey, data, 43200); // 12 hours

    res.json(data);
});

module.exports = router;
