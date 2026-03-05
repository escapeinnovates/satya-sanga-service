// routes/app/quotes.routes.js

const express = require("express");
const { getQuotes } = require("../../controller/app/quotes.controller");

const router = express.Router();

router.get("/", getQuotes);

module.exports = router;