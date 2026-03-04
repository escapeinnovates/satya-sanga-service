const express = require('express');
const { getMeta, updateMeta } = require('../../controller/admin/youtubeMeta.controller');
const router = express.Router();

// GET admin/youtube-meta
router.get('/meta', getMeta);

// POST admin/youtube-meta
router.post('/meta', updateMeta);

module.exports = router;
