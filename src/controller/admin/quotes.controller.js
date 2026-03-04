const service = require("../../services/admin/quotes.service");

// ---------------- GET ALL ----------------
exports.getAll = async (req, res) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch quotes" });
  }
};

// ---------------- CREATE ----------------
exports.create = async (req, res) => {
  try {
    const id = await service.create(req.body);

    res.json({
      success: true,
      id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Create failed" });
  }
};

// ---------------- UPDATE ----------------
exports.update = async (req, res) => {
  try {
    await service.update(req.params.id, req.body);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};

// ---------------- DELETE ----------------
exports.remove = async (req, res) => {
  try {
    await service.remove(req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
};