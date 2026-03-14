const redis = require("../../redis/redisClient");
const worker = require("../../services/admin/worker.service");

const CACHE_KEY = "app:announcements";
const CACHE_TTL = 43200; // 2 minutes


exports.getAnnouncements = async () => {

  // 1️⃣ check redis
  const cached = await redis.get(CACHE_KEY);

  if (cached) {
    console.log("Redis HIT: announcements");
    return JSON.parse(cached);
  }

  console.log("Redis MISS: announcements");

  // 2️⃣ fetch from worker
  const data = await worker.get("/app-announcements");

  const result = data?.data || data;
console.log("Fetched from worker:", result);

  // 3️⃣ store in redis
  await redis.set(
    CACHE_KEY,
    JSON.stringify(result),
    { EX: CACHE_TTL }
  );

  return result;

};