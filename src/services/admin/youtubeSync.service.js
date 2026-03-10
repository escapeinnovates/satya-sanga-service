const worker = require("../../services/admin/worker.service");
const redis = require("../../redis/redisClient");

const {
  fetchPlaylists,
  fetchPlaylistVideos
} = require("../youtube.service");

const { CHANNEL_ID } = require("../../config/env");

const YOUTUBE_CACHE = "app:youtube";

const clearYoutubeCache = async () => {
  await redis.del(YOUTUBE_CACHE);
};


/* ======================================================
   MAIN SYNC FUNCTION
====================================================== */

exports.syncYoutubeToWorker = async () => {

  try {

    console.log("Starting YouTube Sync...");

    const playlists = await fetchPlaylists();

    const payload = await Promise.all(

      playlists.map(async (p) => {

        const videos = await fetchPlaylistVideos(p.id);

        const mappedVideos = videos.map(v => ({
          youtube_video_id: v.youtube_video_id,
          title: v.title,
          description: v.description || null,
          thumbnail_url: v.thumbnail_url || null,
          duration: v.duration || null,
          published_at: v.published_at || null,
          video_url: `https://www.youtube.com/watch?v=${v.youtube_video_id}`
        }));

        return {
          playlist: {
            youtube_playlist_id: p.id,
            channel_id: CHANNEL_ID,
            title: p.snippet.title,
            description: p.snippet.description || null,
            thumbnail_url:
              p.snippet.thumbnails?.high?.url ||
              p.snippet.thumbnails?.default?.url,
            video_count: p.contentDetails.itemCount || 0
          },
          videos: mappedVideos
        };

      })

    );

    await worker.post("/youtube-sync", payload);

    // 🔥 CLEAR REDIS CACHE
    await clearYoutubeCache();

    console.log("YouTube sync completed");

    return {
      success: true,
      playlists: payload.length
    };

  } catch (err) {

    console.error("YouTube Sync Error:", err.message);
    throw err;

  }

};