// routes/app/audio.routes.js

const express = require("express");
const router = express.Router();

const {
  getRootFolders,
  getFolderContent
} = require("../../controller/app/audio.controller");


router.get("/root", getRootFolders);

router.get("/folder/:id", getFolderContent);


module.exports = router;