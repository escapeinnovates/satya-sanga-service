const redis = require("../redis/redisClient");

exports.getCache = async (key) => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

exports.setCache = async (key, value, ttl) => {
  await redis.setEx(key, ttl, JSON.stringify(value));
};
