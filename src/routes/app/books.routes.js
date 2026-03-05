// routes/app/books.routes.js

const express = require("express");
const { getBooks } = require("../../controller/app/books.controller");

const router = express.Router();

router.get("/", getBooks);

module.exports = router;