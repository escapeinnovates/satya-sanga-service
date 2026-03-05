// routes/app/announcements.routes.js

const express = require("express");
const { getAnnouncements } = require("../../controller/app/announcements.controller");

const router = express.Router();

router.get("/", getAnnouncements);

module.exports = router;