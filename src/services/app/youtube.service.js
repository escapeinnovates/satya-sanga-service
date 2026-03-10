const redis = require("../../redis/redisClient");
const worker = require("../admin/worker.service");

const PLAYLIST_CACHE = "app:youtube:playlists";
const VIDEO_PREFIX = "app:youtube:videos:";
const TTL = 43200;


/* ===============================
   GET PLAYLISTS
=============================== */

exports.getPlaylists = async () => {

  const cached = await redis.get(PLAYLIST_CACHE);

  if (cached) {
    return JSON.parse(cached);
  }

  const data = await worker.get("/app-youtube/playlists");

  const result = data?.items || [];

  await redis.set(
    PLAYLIST_CACHE,
    JSON.stringify(result),
    { EX: TTL }
  );

  return result;

};


/* ===============================
   GET VIDEOS
=============================== */

exports.getVideos = async (playlistId) => {

  const key = `${VIDEO_PREFIX}${playlistId}`;

  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const data = await worker.get(`/app-youtube/videos?playlistId=${playlistId}`);

  const result = data?.items || [];

  await redis.set(
    key,
    JSON.stringify(result),
    { EX: TTL }
  );

  return result;

};