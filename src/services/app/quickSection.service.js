const redis = require("../../redis/redisClient");
const worker = require("../../services/admin/worker.service");

const QUICK_CACHE = "app:quick_sections";
const QUICK_BOOK_PREFIX = "app:quick_book:";
const TTL = 43200;


// =====================================================
// GET QUICK SECTIONS
// =====================================================

exports.getQuickSections = async () => {

  const cached = await redis.get(QUICK_CACHE);

  if (cached) {
    return JSON.parse(cached);
  }

  const data = await worker.get("/app-quick-access");

  const result = data?.data || data;

  await redis.set(
    QUICK_CACHE,
    JSON.stringify(result),
    { EX: TTL }
  );

  return result;
};


// =====================================================
// GET QUICK BOOK WITH PAGES
// =====================================================

exports.getBookById = async (bookId) => {

  const key = `${QUICK_BOOK_PREFIX}${bookId}`;

  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const data = await worker.get(`/app/quick/books/${bookId}`);

  const result = data?.data || data;

  await redis.set(
    key,
    JSON.stringify(result),
    { EX: TTL }
  );

  return result;
};