const worker = require("../../services/admin/worker.service");
const { syncYoutubeToWorker } = require("../../services/admin/youtubeSync.service");

/* ======================================================
   SYNC YOUTUBE DATA
====================================================== */

exports.updateMeta = async (req, res) => {

    try {

        const result = await syncYoutubeToWorker();

        res.json({
            success: true,
            message: "YouTube metadata synced",
            playlists: result.playlists
        });

    } catch (err) {

        console.error("YouTube Sync Error:", err.message);

        res.status(500).json({
            success: false,
            message: "Sync failed"
        });

    }

};


/* ======================================================
   GET METADATA FROM WORKER (D1)
====================================================== */

exports.getMeta = async (req, res) => {

    try {

        const data = await worker.get("/youtube-meta");

        res.json({
            success: true,
            data
        });

    } catch (err) {

        console.error("Fetch YouTube Meta Error:", err.message);

        res.status(500).json({
            success: false,
            message: "Failed to fetch metadata"
        });

    }

};