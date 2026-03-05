// controller/app/audio.controller.js

const audioService = require("../../services/app/audio.service");


exports.getRootFolders = async (req, res) => {

  try {

    const folders = await audioService.getRootFolders();

    res.json({
      success: true,
      items: folders
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: "Failed to fetch audio folders"
    });

  }

};


exports.getFolderContent = async (req, res) => {

  try {

    const folderId = req.params.id;

    const data = await audioService.getFolderContent(folderId);

    res.json({
      success: true,
      ...data
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: "Failed to fetch folder content"
    });

  }

};