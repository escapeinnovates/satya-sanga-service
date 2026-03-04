const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  getFolderContent,
  createFolder,
  updateFolder,
  deleteFolder,
  createAudio,
  updateAudio,
  deleteAudio
} = require("../../controller/admin/audioManager.controller");

// ============================
// MULTER (MEMORY STORAGE)
// ============================

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/ogg",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
});

// ============================
// FOLDERS
// ============================

router.get("/folder-content/:id", getFolderContent);
router.post("/folders", createFolder);
router.put("/folders/:id", updateFolder);
router.delete("/folders/:id", deleteFolder);

// ============================
// AUDIOS
// ============================

router.post("/audios", upload.single("audio"), createAudio);
router.put("/audios/:id", upload.single("audio"), updateAudio);
router.delete("/audios/:id", deleteAudio);

module.exports = router;