const axios = require("axios");
const redis = require("../../redis/redisClient");

const WORKER = process.env.WORKER_BASE_URL;

const worker = axios.create({
  baseURL: WORKER,
});

const QUOTES_CACHE = "app:quotes";

const clearQuotesCache = async () => {
  await redis.del(QUOTES_CACHE);
};


// ---------------- GET ALL ----------------
exports.getAll = async () => {
  const res = await worker.get("/quotes");
  return res.data;
};


// ---------------- CREATE ----------------
exports.create = async (data) => {

  const payload = {
    content: data.content,
    author: data.author || null,
    display_date: data.display_date || null,
  };

  const res = await worker.post("/quotes", payload);

  if (!res.data?.id) {
    throw new Error("Worker did not return quote ID");
  }

  await clearQuotesCache();

  return res.data.id;
};


// ---------------- UPDATE ----------------
exports.update = async (id, data) => {

  const payload = {};

  if (data.content !== undefined)
    payload.content = data.content;

  if (data.author !== undefined)
    payload.author = data.author;

  if (data.display_date !== undefined)
    payload.display_date = data.display_date;

  await worker.put(`/quotes/${id}`, payload);

  await clearQuotesCache();
};


// ---------------- DELETE ----------------
exports.remove = async (id) => {

  if (!id) throw new Error("Invalid quote ID");

  await worker.delete(`/quotes/${id}`);

  await clearQuotesCache();
};