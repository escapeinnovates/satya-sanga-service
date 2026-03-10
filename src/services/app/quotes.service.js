const redis = require("../../redis/redisClient");
const worker = require("../../services/admin/worker.service");

const QUOTES_CACHE = "app:quotes";
const TTL = 43200;


// =====================================================
// GET QUOTES
// =====================================================

exports.getQuotes = async () => {

  const cached = await redis.get(QUOTES_CACHE);

  if (cached) {
    return JSON.parse(cached);
  }

  const data = await worker.get("/app-quotes");

  const result = data?.data || data;

  await redis.set(
    QUOTES_CACHE,
    JSON.stringify(result),
    { EX: TTL }
  );

  return result;
};