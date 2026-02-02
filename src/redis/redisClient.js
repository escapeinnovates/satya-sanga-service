const { createClient } = require("redis");
const { REDIS_URL } = require("../config/env");

const client = createClient({ url: REDIS_URL });

client.on("error", (err) => {
  console.error("Redis error:", err);
});

(async () => {
  await client.connect();
  console.log("Redis connected");
})();

module.exports = client;
