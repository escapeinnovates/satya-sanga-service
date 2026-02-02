const express = require("express");
const { fetchQuotesFromSheet } =
  require("../services/sheets.service");
const { getCache, setCache } = require("../utils/cache");

const router = express.Router();

// 🔒 CONFIG (keep in env if you want later)
const SHEET_ID = "1k1e0ymzVUYeottVp29J-q37V1ulb6eJi29OgfcrNUvU";
const SHEET_NAME = "Sheet1";

/**
 * ✅ GET /api/sheets/quotes
 */
router.get("/quotes", async (req, res) => {
  try {
    const cacheKey = "sheets:quotes";

    const cached = await getCache(cacheKey);
    console.log(cached);
    
    if (cached) {
      console.log("🔥 Quotes cache HIT");
      return res.json({ items: cached });
    }

    console.log("🌐 Quotes cache MISS → Google Sheets");

    const data = await fetchQuotesFromSheet(
      SHEET_ID,
      SHEET_NAME
    );

    // ⏱ Cache for 12 hours
    await setCache(cacheKey, data, 43200);

    res.json({ items: data });
  } catch (err) {
    console.error(
      "❌ Sheets API error:",
      err.response?.data || err.message
    );
    res.status(500).json({
      message: "Failed to fetch quotes",
      error: err.response?.data || err.message,
    });
  }
});

module.exports = router;
