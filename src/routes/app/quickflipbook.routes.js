// routes/app/books.routes.js

const express = require("express");
const {
  getBookById
} = require("../../controller/app/quickSection.controller");

const router = express.Router();


// GET BOOK + PAGES (flipbook data)
router.get("/:id", getBookById);


module.exports = router;