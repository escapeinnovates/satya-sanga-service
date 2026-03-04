const service = require("../../services/admin/books.service");

exports.getAll = async (req, res) => {
    const data = await service.getAll();
    res.json(data);
};

exports.create = async (req, res) => {
    try {
        const coverFile = req.files?.cover?.[0] || null;
        const zipFile = req.files?.zip?.[0] || null;

        const id = await service.createBook(req.body, coverFile, zipFile);

        res.json({ success: true, id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Create failed" });
    }
};

exports.update = async (req, res) => {
    try {
        const bookId = req.params.id;
        const body = { ...req.body };

        // Normalize is_active properly
        if (body.is_active !== undefined) {
            body.is_active = Number(body.is_active);
        }

        // If cover uploaded
        if (req.file) {
            const newCoverUrl = await service.updateCover(bookId, req.file);
            body.cover_url = newCoverUrl;
        }

        await service.updateBook(bookId, body);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Update failed" });
    }
};
exports.getPages = async (req, res) => {
    const pages = await service.getPages(req.params.id);
    res.json(pages);
};

exports.updatePageImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "File required",
            });
        }

        const result = await service.updatePageImage(
            req.params.id,
            req.file
        );

        res.json({
            success: true,
            imageUrl: result.imageUrl,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Replace failed",
        });
    }
};

exports.updatePageMeta = async (req, res) => {
    // Logic to update page meta data (name, description, etc.)
    const result = await service.updatePageMeta(req.params.id, req.body);
    res.json({ success: true, result });
};

exports.deletePage = async (req, res) => {
    await service.deletePage(req.params.id);
    res.json({ success: true });
};

exports.deleteBook = async (req, res) => {
    try {
        await service.deleteBook(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Delete failed" });
    }
};

exports.reorderPages = async (req, res) => {
    try {
        await service.reorderPages(req.params.id, req.body.pages);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Reorder failed" });
    }
};

exports.uploadPages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded",
            });
        }

        await service.uploadMultiplePages(
            req.params.id,
            req.files
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Upload failed",
        });
    }
};