// routes/app/quickSection.routes.js

const express = require("express");
const { getQuickSections } = require("../../controller/app/quickSection.controller");

const router = express.Router();

router.get("/", getQuickSections);

module.exports = router;