const express = require("express");
const { listBooks } = require("../services/drive.service");
const { getCache, setCache } = require("../utils/cache");

const router = express.Router();

router.get("/books", async (req, res) => {
    try {
        const { rootFolderId } = req.query;

        if (!rootFolderId) {
            return res.status(400).json({
                message: "rootFolderId is required",
            });
        }

        const cacheKey = `drive:books:${rootFolderId}`;

        // 🔍 Redis cache check
        const cached = await getCache(cacheKey);
        if (cached) {
            console.log("🔥 Books cache HIT");
            // ✅ ALWAYS return items
            return res.json({ items: cached });
        }

        console.log("🌐 Books cache MISS → Google Drive");

        // 📚 Fetch books
        const books = await listBooks(rootFolderId);

        // ⏱ Cache for 12 hours
        await setCache(cacheKey, books, 43200);

        console.log("📚 Books:", books);

        // ✅ ALWAYS return items
        res.json({ items: books });

    } catch (err) {
        console.error("❌ Books API error:", err.message);
        res.status(500).json({
            message: "Books API failed",
            error: err.message,
        });
    }
});

module.exports = router;
