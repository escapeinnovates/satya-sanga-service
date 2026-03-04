const service = require("../../services/admin/announcements.service");

// ---------------- GET ALL ----------------
exports.getAll = async (req, res) => {
  try {
    const data = await service.getAll();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch announcements" });
  }
};

// ---------------- CREATE ----------------
exports.create = async (req, res) => {
  try {
    const file = req.file;
    const body = req.body;

    // 1️⃣ Create announcement first
    const insertedId = await service.create(body);

    // 2️⃣ If banner exists, upload it
    if (file) {
      await service.uploadBanner(insertedId, file);
    }

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Create failed" });
  }
};

// ---------------- UPDATE ----------------
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const file = req.file;
    const body = req.body;

    // 1️⃣ Update text fields
    await service.update(id, body);

    // 2️⃣ Replace banner if new file uploaded
    if (file) {
      await service.replaceBanner(id, file);
    }

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

exports.replaceBanner = async (id, file) => {
  // 1️⃣ Get old banner
  const res = await worker.get(`/announcements/${id}`);
  const oldBanner = res.data?.banner_image_key;

  // 2️⃣ Delete old banner if exists
  if (oldBanner) {
    const key = oldBanner.replace(`${process.env.R2_PUBLIC_URL}/`, "");

    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
      })
    );
  }

  // 3️⃣ Upload new one
  return await exports.uploadBanner(id, file);
};