const redis = require("../../redis/redisClient");
const worker = require("../../services/admin/worker.service");

const ROOT_CACHE = "app:audio:root";
const FOLDER_PREFIX = "app:audio:folder:";
const TTL = 43200;


/* ======================================================
   GET ROOT AUDIO FOLDERS
====================================================== */

exports.getRootFolders = async () => {

  const cached = await redis.get(ROOT_CACHE);

  if (cached) {
    console.log("Redis HIT: audio root");
    return JSON.parse(cached);
  }

  console.log("Redis MISS: audio root");

  const data = await worker.get("/app-audio/root");

  const result = data?.items || data?.folders || [];

  await redis.set(ROOT_CACHE, JSON.stringify(result), { EX: TTL });

  return result;
};


/* ======================================================
   GET FOLDER CONTENT
====================================================== */

exports.getFolderContent = async (folderId) => {

  const key = `${FOLDER_PREFIX}${folderId}`;

  const cached = await redis.get(key);

  if (cached) {
    console.log("Redis HIT: folder", folderId);
    return JSON.parse(cached);
  }

  console.log("Redis MISS: folder", folderId);

  const data = await worker.get(`/app-audio/folder/${folderId}`);

  const result = {
    folders: data?.folders || [],
    audios: data?.audios || []
  };

  await redis.set(key, JSON.stringify(result), { EX: TTL });

  return result;
};