const redis = require("../../redis/redisClient");
const worker = require("../../services/admin/worker.service");

const BOOKS_CACHE = "app:books";
const BOOK_PREFIX = "app:book:";
const TTL = 43200;


// =====================================================
// GET ALL BOOKS
// =====================================================

exports.getBooks = async () => {

  const cached = await redis.get(BOOKS_CACHE);

  if (cached) {
    return JSON.parse(cached);
  }

  const data = await worker.get("/app/books");

  const result = data?.data || data;

  await redis.set(
    BOOKS_CACHE,
    JSON.stringify(result),
    { EX: TTL }
  );

  return result;
};


// =====================================================
// GET BOOK WITH PAGES
// =====================================================

exports.getBookById = async (bookId) => {

  const key = `${BOOK_PREFIX}${bookId}`;

  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const data = await worker.get(`/app/books/${bookId}`);

  const result = data?.data || data;

  await redis.set(
    key,
    JSON.stringify(result),
    { EX: TTL }
  );

  return result;
};