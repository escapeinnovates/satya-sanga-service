const express = require("express");
const axios = require("axios");
const { fetchDriveItems } = require("../services/drive.service");
const { GOOGLE_API_KEY } = require("../config/env");

const { getCache, setCache } = require("../utils/cache");

const router = express.Router();

/**
 * ✅ Helper: Get cached Drive items for a book
 */
async function getBookItems(bookId) {
  const cacheKey = `book:${bookId}:items`;

  // 🔥 Redis HIT
  const cached = await getCache(cacheKey);
  if (cached) {
    console.log("🔥 Redis HIT:", cacheKey);
    return cached;
  }

  // 🌐 Redis MISS → Google Drive
  console.log("🌐 Redis MISS → Fetching Drive Items:", bookId);

  const items = await fetchDriveItems(bookId);

  // Cache for 12 hours
  await setCache(cacheKey, items, 43200);

  return items;
}

/**
 * 📘 Book Cover (PUBLIC)
 */
router.get("/:bookId/cover", async (req, res) => {
  try {
    const { bookId } = req.params;

    // ✅ Get cached folder items
    const items = await getBookItems(bookId);

    const images = items.filter((i) =>
      i.mimeType.startsWith("image/")
    );

    if (!images.length) {
      return res.status(404).send("No cover found");
    }

    // Pick cover file
    const cover =
      images.find((i) =>
        i.name.toLowerCase().includes("cover")
      ) || images[0];

    // Fetch image stream from Drive
    const driveRes = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${cover.id}`,
      {
        params: {
          key: GOOGLE_API_KEY,
          alt: "media",
        },
        responseType: "stream",
      }
    );

    // ✅ Required headers
    res.setHeader("Content-Type", cover.mimeType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Cross-Origin-Resource-Policy",
      "cross-origin"
    );

    driveRes.data.pipe(res);
  } catch (err) {
    console.error("❌ Cover error:", err.message);
    res.status(500).send("Cover load failed");
  }
});

/**
 * 📑 List All Pages (PUBLIC)
 */
router.get("/:bookId/pages", async (req, res) => {
  try {
    const { bookId } = req.params;

    // ✅ Cached folder items
    const items = await getBookItems(bookId);

    // Only pages (exclude cover)
    const images = items
      .filter(
        (i) =>
          i.mimeType.startsWith("image/") &&
          !i.name.toLowerCase().includes("cover")
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
        })
      );

    // Return page numbers
    const pages = images.map((img, index) => ({
      page: index + 1,
      name: img.name,
    }));

    res.json({ pages });
  } catch (err) {
    console.error("❌ Pages list error:", err.message);
    res.status(500).send("Failed to list pages");
  }
});

/**
 * 📄 Single Page Image Stream (PUBLIC)
 */
router.get("/:bookId/pages/:page", async (req, res) => {
  try {
    const { bookId, page } = req.params;

    // ✅ Cached folder items
    const items = await getBookItems(bookId);

    const images = items
      .filter(
        (i) =>
          i.mimeType.startsWith("image/") &&
          !i.name.toLowerCase().includes("cover")
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, {
          numeric: true,
        })
      );

    const image = images[Number(page) - 1];

    if (!image) {
      return res.status(404).send("Page not found");
    }

    // Fetch image stream from Drive
    const driveRes = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${image.id}`,
      {
        params: {
          key: GOOGLE_API_KEY,
          alt: "media",
        },
        responseType: "stream",
      }
    );

    // ✅ Required headers
    res.setHeader("Content-Type", image.mimeType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Cross-Origin-Resource-Policy",
      "cross-origin"
    );

    driveRes.data.pipe(res);
  } catch (err) {
    console.error("❌ Page error:", err.message);
    res.status(500).send("Page load failed");
  }
});

module.exports = router;
