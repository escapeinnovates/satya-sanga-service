const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  getAllQuickSections,
  getQuickSectionById,
  createQuickSection,
  updateQuickSection,
  deleteQuickSection,
  reorderQuickSection
} = require("../../controller/admin/quickSection.controller");

// =====================================================
// MULTER CONFIG (BOOK ZIP SAFE)
// =====================================================

const upload = multer({
  storage: multer.memoryStorage(), // 🔥 REQUIRED for ZIP extraction
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB

  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const allowedImageTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    const allowedAudioTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
    ];

    const allowedVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    const allowedZipMimeTypes = [
      "application/zip",
      "application/x-zip-compressed",
      "application/octet-stream",
    ];

    // ✅ ZIP SUPPORT
    if (
      ext === ".zip" ||
      allowedZipMimeTypes.includes(file.mimetype)
    ) {
      return cb(null, true);
    }

    // ✅ Image / Audio / Video
    if (
      allowedImageTypes.includes(file.mimetype) ||
      allowedAudioTypes.includes(file.mimetype) ||
      allowedVideoTypes.includes(file.mimetype)
    ) {
      return cb(null, true);
    }

    cb(new Error("Unsupported file type"));
  },
});

// =====================================================
// ROUTES
// Mounted as: /admin/quick-section
// =====================================================

// GET all
router.get("/", getAllQuickSections);

// GET single
router.get("/:id", getQuickSectionById);

// CREATE
router.post(
  "/",
  upload.fields([
    { name: "media", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  createQuickSection
);

// UPDATE
router.put(
  "/:id",
  upload.fields([
    { name: "media", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  updateQuickSection
);

// DELETE
router.delete("/:id", deleteQuickSection);

// REORDER
router.put("/reorder/sort", reorderQuickSection);

module.exports = router;