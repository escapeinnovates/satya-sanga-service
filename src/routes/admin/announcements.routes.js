const express = require("express");
const multer = require("multer");
const controller = require("../../controller/admin/announcements.controller");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// GET
router.get("/", controller.getAll);

// CREATE (with banner support)
router.post(
  "/",
  upload.single("file"),
  controller.create
);

// UPDATE (with banner support)
router.put(
  "/:id",
  upload.single("file"),
  controller.update
);

// DELETE
router.delete("/:id", controller.remove);

module.exports = router;