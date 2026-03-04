const quickService = require("../../services/admin/quickSection.service");

// =====================================================
// GET ALL
// =====================================================

exports.getAllQuickSections = async (req, res) => {
  try {
    const data = await quickService.getAllQuickSections();
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// =====================================================
// GET SINGLE
// =====================================================

exports.getQuickSectionById = async (req, res) => {
  try {
    const data = await quickService.getQuickSectionById(req.params.id);
    return res.json(data);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

// =====================================================
// CREATE
// =====================================================

exports.createQuickSection = async (req, res) => {

  if (req.body.content_type === "book" && !req.files?.media?.[0]) {
    return res.status(400).json({ message: "ZIP file required for book" });
  }

  try {
    const data = await quickService.createQuickSection({
      title: req.body.title,
      content_type: req.body.content_type,
      description: req.body.description,
      sort_order: req.body.sort_order,
      is_active: req.body.is_active,
      mediaFile: req.files?.media?.[0],
      thumbnailFile: req.files?.thumbnail?.[0],
    });

    return res.status(201).json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// =====================================================
// UPDATE (media optional)
// =====================================================

exports.updateQuickSection = async (req, res) => {

  if (req.body.content_type === "book" && !req.files?.media?.[0]) {
    return res.status(400).json({ message: "ZIP file required for book" });
  }
  try {
    const data = await quickService.updateQuickSection({
      id: req.params.id,
      title: req.body.title,
      content_type: req.body.content_type,
      description: req.body.description,
      sort_order: req.body.sort_order,
      is_active: req.body.is_active,
      mediaFile: req.files?.media?.[0],
      thumbnailFile: req.files?.thumbnail?.[0],
    });

    return res.json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// =====================================================
// DELETE
// =====================================================

exports.deleteQuickSection = async (req, res) => {
  try {
    const data = await quickService.deleteQuickSection(req.params.id);
    return res.json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// =====================================================
// REORDER (Bulk sort update)
// Body format:
// [
//   { id: 1, sort_order: 1 },
//   { id: 2, sort_order: 2 }
// ]
// =====================================================

exports.reorderQuickSection = async (req, res) => {
  try {
    const data = await quickService.reorderQuickSection(req.body);
    return res.json(data);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};