const axios = require("axios");
const r2 = require("../../config/r2");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const WORKER = process.env.WORKER_BASE_URL;
const worker = axios.create({ baseURL: WORKER });


// ------------------ GET ALL ------------------
exports.getAll = async () => {
  const res = await worker.get("/announcements");
  return res.data;
};


// ------------------ CREATE ------------------
exports.create = async (data) => {
  const payload = {
    title: data.title,
    message_md: data.message,
    status: data.is_active === "true" || data.is_active === true
      ? "published"
      : "draft",
    publish_at: data.start_date || null,
    expire_at: data.end_date || null,
  };

  const res = await worker.post("/announcements", payload);

  if (!res.data?.id) {
    throw new Error("Worker did not return announcement ID");
  }

  return res.data.id;
};


// ------------------ UPDATE TEXT FIELDS ------------------
exports.update = async (id, data) => {
  const payload = {};

  if (data.title !== undefined)
    payload.title = data.title;

  if (data.message !== undefined)
    payload.message_md = data.message;

  if (data.start_date !== undefined)
    payload.publish_at = data.start_date;

  if (data.end_date !== undefined)
    payload.expire_at = data.end_date;

  if (data.is_active !== undefined)
    payload.status =
      data.is_active === "true" || data.is_active === true
        ? "published"
        : "draft";

  await worker.put(`/announcements/${id}`, payload);
};


// ------------------ UPLOAD NEW BANNER ------------------
exports.uploadBanner = async (id, file) => {
  if (!file) throw new Error("No file provided");

  const extension = file.originalname.split(".").pop();
  const key = `announcements/announcement-${id}-${Date.now()}.${extension}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  // Update DB with new banner URL
  await worker.put(`/announcements/${id}`, {
    banner_image_key: publicUrl,
  });

  return publicUrl;
};


// ------------------ REPLACE BANNER ------------------
exports.replaceBanner = async (id, file) => {
  // 1️⃣ Get old announcement
  const res = await worker.get(`/announcements/${id}`);
  const announcement = res.data;

  if (!announcement) {
    throw new Error("Announcement not found");
  }

  const oldBanner = announcement.banner_image_key;

  // 2️⃣ Delete old image if exists
  if (oldBanner) {
    try {
      const key = oldBanner.replace(`${process.env.R2_PUBLIC_URL}/`, "");

      await r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
        })
      );
    } catch (err) {
      console.error("Failed to delete old banner:", err);
    }
  }

  // 3️⃣ Upload new banner
  return await exports.uploadBanner(id, file);
};


// ------------------ DELETE ------------------
exports.remove = async (id) => {
  if (!id) throw new Error("Invalid announcement ID");

  // 1️⃣ Get announcement
  const res = await worker.get(`/announcements/${id}`);
  const announcement = res.data;

  if (!announcement) {
    throw new Error("Announcement not found");
  }

  const bannerUrl = announcement.banner_image_key;

  // 2️⃣ Delete banner if exists
  if (bannerUrl) {
    try {
      const key = bannerUrl.replace(`${process.env.R2_PUBLIC_URL}/`, "");

      await r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
        })
      );
    } catch (err) {
      console.error("Failed to delete banner:", err);
    }
  }

  // 3️⃣ Delete DB record
  await worker.delete(`/announcements/${id}`);

  return true;
};