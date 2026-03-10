const worker = require("./worker.service");
const redis = require("../../redis/redisClient");

const {
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command
} = require("@aws-sdk/client-s3");

const r2 = require("../../config/r2");
const AdmZip = require("adm-zip");
const slugify = require("slugify");

const QUICK_CACHE = "app:quick_sections";

const clearQuickCache = async () => {
  await redis.del(QUICK_CACHE);
};


// =====================================================
// GET ALL
// =====================================================

exports.getAllQuickSections = async () => {
  return await worker.get("/quick-access");
};


// =====================================================
// GET SINGLE
// =====================================================

exports.getQuickSectionById = async (id) => {
  if (!id) throw new Error("ID required");
  return await worker.get(`/quick-access/${id}`);
};


// =====================================================
// CREATE
// =====================================================

exports.createQuickSection = async ({
  title,
  content_type,
  description,
  sort_order,
  is_active,
  mediaFile,
  thumbnailFile,
}) => {

  if (!title || !content_type || !mediaFile) {
    throw new Error("Title, type and media file are required");
  }

  let mediaKey = null;
  let thumbnailKey = null;
  let detectedImageType = null;
  let totalPages = null;

  try {

    if (content_type === "book") {

      if (!mediaFile.originalname.toLowerCase().endsWith(".zip")) {
        throw new Error("Book must be ZIP file");
      }

      const cleanName = slugify(title, { lower: true, strict: true });
      const folderName = `${cleanName}-${Date.now()}`;
      const baseFolder = `quick-access/book/${folderName}`;

      const zip = new AdmZip(mediaFile.buffer);
      const entries = zip.getEntries();

      const imageFiles = entries
        .filter(
          (e) =>
            !e.isDirectory &&
            /\.(png|jpg|jpeg|webp)$/i.test(e.entryName)
        )
        .sort((a, b) => a.entryName.localeCompare(b.entryName));

      if (imageFiles.length === 0) {
        throw new Error("ZIP must contain image files");
      }

      let pageIndex = 1;

      for (const file of imageFiles) {

        const ext = file.entryName.split(".").pop().toLowerCase();

        if (!detectedImageType) detectedImageType = ext;

        if (ext !== detectedImageType) {
          throw new Error("All book images must have same format");
        }

        const padded = String(pageIndex).padStart(3, "0");
        const fileName = `page-${padded}.${ext}`;
        const key = `${baseFolder}/${fileName}`;

        await r2.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
            Body: file.getData(),
            ContentType: `image/${ext}`,
          })
        );

        pageIndex++;
      }

      totalPages = pageIndex - 1;
      mediaKey = baseFolder;
    }

    else {

      const ext = mediaFile.originalname.split(".").pop();
      const key = `quick-access/${content_type}/${Date.now()}.${ext}`;

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
          Body: mediaFile.buffer,
          ContentType: mediaFile.mimetype,
        })
      );

      mediaKey = key;
    }


    if (thumbnailFile) {

      const ext = thumbnailFile.originalname.split(".").pop();
      const thumbKey = `quick-access/${content_type}/thumb-${Date.now()}.${ext}`;

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: thumbKey,
          Body: thumbnailFile.buffer,
          ContentType: thumbnailFile.mimetype,
        })
      );

      thumbnailKey = thumbKey;
    }

    const result = await worker.post("/quick-access", {
      title,
      content_type,
      media_key: mediaKey,
      thumbnail_key: thumbnailKey,
      description: description || null,
      duration_seconds: null,
      sort_order: sort_order || 0,
      is_active: is_active ? 1 : 0,
      image_type: detectedImageType,
      total_pages: totalPages,
    });

    await clearQuickCache();

    return result;

  } catch (err) {
    throw new Error(err.message);
  }
};


// =====================================================
// UPDATE
// =====================================================

exports.updateQuickSection = async ({
  id,
  title,
  content_type,
  description,
  sort_order,
  is_active,
  mediaFile,
  thumbnailFile,
}) => {

  if (!id) throw new Error("ID required");

  const existing = await worker.get(`/quick-access/${id}`);
  if (!existing) throw new Error("Quick section not found");

  let mediaKey = existing.media_key;
  let thumbnailKey = existing.thumbnail_key;

  let detectedImageType = existing.image_type || null;
  let totalPages = existing.total_pages || null;

  try {

    if (mediaFile && content_type === "book") {

      if (!mediaFile.originalname.toLowerCase().endsWith(".zip")) {
        throw new Error("Book must be ZIP file");
      }

      if (existing.media_key) {
        await safeDeleteFolder(existing.media_key);
      }

      const cleanName = slugify(title || existing.title, {
        lower: true,
        strict: true,
      });

      const folderKey = `${cleanName}-${Date.now()}`;
      const baseFolder = `quick-access/book/${folderKey}`;

      const zip = new AdmZip(mediaFile.buffer);
      const entries = zip.getEntries();

      const imageFiles = entries
        .filter(
          (e) =>
            !e.isDirectory &&
            /\.(jpg|jpeg|webp)$/i.test(e.entryName)
        )
        .sort((a, b) => a.entryName.localeCompare(b.entryName));

      if (imageFiles.length === 0) {
        throw new Error("ZIP must contain image files");
      }

      let pageIndex = 1;
      detectedImageType = null;

      for (const file of imageFiles) {

        const ext = file.entryName.split(".").pop().toLowerCase();

        if (!detectedImageType) detectedImageType = ext;

        if (ext !== detectedImageType) {
          throw new Error("All book images must have same format");
        }

        const padded = String(pageIndex).padStart(3, "0");
        const fileName = `page-${padded}.${ext}`;
        const key = `${baseFolder}/${fileName}`;

        await r2.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: key,
            Body: file.getData(),
            ContentType: `image/${ext}`,
          })
        );

        pageIndex++;
      }

      totalPages = pageIndex - 1;
      mediaKey = baseFolder;
    }

    else if (mediaFile) {

      const ext = mediaFile.originalname.split(".").pop();
      const newKey = `quick-access/${content_type}/${Date.now()}.${ext}`;

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: newKey,
          Body: mediaFile.buffer,
          ContentType: mediaFile.mimetype,
        })
      );

      if (existing.media_key) {
        await safeDelete(existing.media_key);
      }

      mediaKey = newKey;

      if (existing.content_type === "book") {
        detectedImageType = null;
        totalPages = null;
      }
    }


    if (thumbnailFile) {

      const ext = thumbnailFile.originalname.split(".").pop();
      const newThumb = `quick-access/${content_type}/thumb-${Date.now()}.${ext}`;

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: newThumb,
          Body: thumbnailFile.buffer,
          ContentType: thumbnailFile.mimetype,
        })
      );

      if (existing.thumbnail_key) {
        await safeDelete(existing.thumbnail_key);
      }

      thumbnailKey = newThumb;
    }


    const result = await worker.put(`/quick-access/${id}`, {
      title: title || existing.title,
      content_type: content_type || existing.content_type,
      media_key: mediaKey,
      thumbnail_key: thumbnailKey,
      description: description || existing.description,
      duration_seconds: existing.duration_seconds,
      sort_order: sort_order ?? existing.sort_order,
      is_active: is_active ?? existing.is_active,
      image_type: content_type === "book" ? detectedImageType : null,
      total_pages: content_type === "book" ? totalPages : null,
    });

    await clearQuickCache();

    return result;

  } catch (err) {
    throw new Error(err.message);
  }
};


// =====================================================
// DELETE
// =====================================================

exports.deleteQuickSection = async (id) => {

  if (!id) throw new Error("ID required");

  const existing = await worker.get(`/quick-access/${id}`);
  if (!existing) throw new Error("Quick section not found");

  try {

    if (existing.content_type === "book" && existing.media_key) {
      await safeDeleteFolder(existing.media_key);
    }

    else if (existing.media_key) {
      await safeDelete(existing.media_key);
    }

    if (existing.thumbnail_key) {
      await safeDelete(existing.thumbnail_key);
    }

    const result = await worker.delete(`/quick-access/${id}`);

    await clearQuickCache();

    return result;

  } catch (error) {
    throw new Error(error.message || "Quick section deletion failed");
  }
};


// =====================================================
// REORDER
// =====================================================

exports.reorderQuickSection = async (items) => {

  if (!Array.isArray(items)) {
    throw new Error("Invalid reorder payload");
  }

  const result = await worker.put("/quick-access/reorder/sort", items);

  await clearQuickCache();

  return result;
};


// =====================================================
// SAFE DELETE
// =====================================================

async function safeDelete(key) {
  try {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
      })
    );
  } catch (err) {
    console.error("R2 delete failed:", err.message);
  }
}

async function safeDeleteFolder(prefix) {

  try {

    const listed = await r2.send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_BUCKET,
        Prefix: prefix,
      })
    );

    if (!listed.Contents || listed.Contents.length === 0) return;

    for (const file of listed.Contents) {

      await r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: file.Key,
        })
      );
    }

  } catch (err) {
    console.error("R2 folder delete failed:", err.message);
  }
}