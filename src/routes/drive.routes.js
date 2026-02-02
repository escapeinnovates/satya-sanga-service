const express = require("express");
const {
    fetchDriveItems,
    fetchRecursive,
} = require("../services/drive.service");
const { getCache, setCache } = require("../utils/cache");

const router = express.Router();

router.get("/read-items", async (req, res) => {
    try {
        const { folderId, recursive } = req.query;

        if (!folderId) {
            return res.status(400).json({
                message: "folderId is required",
            });
        }

        const cacheKey = recursive === "true"
            ? `drive:recursive:${folderId}`
            : `drive:single:${folderId}`;

        // 🔍 Cache check
        const cached = await getCache(cacheKey);
        if (cached) {
            console.log("🔥 Drive cache HIT");
            return res.json({ files: cached });
        }

        console.log("🌐 Drive cache MISS → Google API");

        let files;
        if (recursive === "true") {
            files = await fetchRecursive(folderId);
        } else {
            files = await fetchDriveItems(folderId);
        }

        // ⏱ Cache for 12 hours
        await setCache(cacheKey, files, 43200);

        res.json({ files });
    } catch (err) {
        console.error("❌ Drive API error:", err.response?.data || err.message);
        res.status(500).json({
            message: "Drive API failed",
            error: err.response?.data || err.message,
        });
    }
});

module.exports = router;