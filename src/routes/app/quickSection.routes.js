// routes/app/quickSection.routes.js

const express = require("express");
const { getQuickSections, getBookById } = require("../../controller/app/quickSection.controller");

const router = express.Router();

router.get("/", getQuickSections);
router.get("/:id", getBookById);

module.exports = router;