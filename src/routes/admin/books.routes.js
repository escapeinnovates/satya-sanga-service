const express = require("express");
const multer = require("multer");
const controller = require("../../controller/admin/books.controller");

const router = express.Router();

// Multer setup for file handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Route to get all books
router.get("/", controller.getAll);

// Route to get book pages by book id
router.get("/:id/pages", controller.getPages);

// Route to create a book with cover image and zip of pages
router.post(
  "/",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "zip", maxCount: 1 }
  ]),
  controller.create
);

// Route to update book (cover image, pages, etc.)
router.put(
  "/:id",
  upload.single("cover"),  // For updating cover image
  controller.update
);

// Route to update a page's image by page ID
router.put(
  "/book-pages/:id/image",
  upload.single("file"),
  controller.updatePageImage
);

// Route to update page meta (name, description, etc.)
router.put("/book-pages/:id", controller.updatePageMeta);

// Route to delete a book page
router.delete("/book-pages/:id", controller.deletePage);

// Route to delete a book
router.delete("/:id", controller.deleteBook);

router.put("/:id/reorder", controller.reorderPages);

router.post(
  "/:id/pages",
  upload.array("files", 50),
  controller.uploadPages
);

module.exports = router;