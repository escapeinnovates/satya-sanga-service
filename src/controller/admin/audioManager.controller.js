const audioService = require("../../services/admin/audioManager.service");

// =====================================================
// FOLDER CONTROLLER
// =====================================================

exports.getFolderContent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Folder id is required" });
    }

    const data = await audioService.getFolderContent(id);
    return res.json(data);
  } catch (error) {
    console.error("getFolderContent error:", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.createFolder = async (req, res) => {
  try {
    const { name, description, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const data = await audioService.createFolder({
      name,
      description,
      parent_id,
    });

    return res.status(201).json(data);
  } catch (error) {
    console.error("createFolder error:", error);
    return res.status(400).json({ message: error.message });
  }
};

exports.updateFolder = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await audioService.updateFolder(id, req.body);
    return res.json(data);
  } catch (error) {
    console.error("updateFolder error:", error);
    return res.status(400).json({ message: error.message });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await audioService.deleteFolder(id);
    return res.json(data);
  } catch (error) {
    console.error("deleteFolder error:", error);
    return res.status(400).json({ message: error.message });
  }
};

// =====================================================
// AUDIO CONTROLLER
// =====================================================

exports.createAudio = async (req, res) => {
  try {
    const { folder_id, title, duration_seconds } = req.body;

    if (!folder_id || !title) {
      return res.status(400).json({
        message: "folder_id and title are required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Audio file is required",
      });
    }

    const data = await audioService.createAudio({
      folder_id,
      title,
      duration_seconds,
      file: req.file,
    });

    return res.status(201).json(data);
  } catch (error) {
    console.error("createAudio error:", error);
    return res.status(400).json({ message: error.message });
  }
};

exports.updateAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, duration_seconds } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Audio id is required" });
    }

    const data = await audioService.updateAudio({
      id,
      title,
      duration_seconds,
      file: req.file || null, // optional replacement
    });

    return res.json(data);
  } catch (error) {
    console.error("updateAudio error:", error);
    return res.status(400).json({ message: error.message });
  }
};

exports.deleteAudio = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Audio id is required" });
    }

    const data = await audioService.deleteAudio(id);
    return res.json(data);
  } catch (error) {
    console.error("deleteAudio error:", error);
    return res.status(400).json({ message: error.message });
  }
};