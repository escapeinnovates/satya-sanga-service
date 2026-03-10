const worker = require("./worker.service");
const redis = require("../../redis/redisClient");

const {
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const r2 = require("../../config/r2");

const ROOT_CACHE = "app:audio:root";
const FOLDER_PREFIX = "app:audio:folder:";


// =====================================================
// FOLDER SERVICES
// =====================================================

exports.getFolderContent = async (folderId) => {
  return await worker.get(`/audio-manager/folder-content/${folderId}`);
};


exports.createFolder = async ({ name, description, parent_id }) => {

  if (!name) throw new Error("Folder name is required");

  const result = await worker.post(`/audio-manager/audio-folders`, {
    name,
    description: description || null,
    parent_id: parent_id || null,
  });

  await redis.del(ROOT_CACHE);

  return result;
};


exports.updateFolder = async (id, data) => {

  const result = await worker.put(`/audio-manager/audio-folders/${id}`, data);

  await redis.del(ROOT_CACHE);
  await redis.del(`${FOLDER_PREFIX}${id}`);

  return result;
};


exports.deleteFolder = async (folderId) => {

  try {

    const content = await worker.get(
      `/audio-manager/folder-content/${folderId}`
    );

    const audios = content.audios || [];
    const subfolders = content.folders || [];

    for (const audio of audios) {
      if (audio.audio_key) {
        await r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: audio.audio_key,
          })
        );
      }
    }

    for (const sub of subfolders) {

      const subContent = await worker.get(
        `/audio-manager/folder-content/${sub.id}`
      );

      for (const audio of subContent.audios || []) {

        if (audio.audio_key) {

          await r2.send(
            new DeleteObjectCommand({
              Bucket: process.env.R2_BUCKET,
              Key: audio.audio_key,
            })
          );
        }
      }
    }

    const result = await worker.delete(
      `/audio-manager/audio-folders/${folderId}`
    );

    await redis.del(ROOT_CACHE);
    await redis.del(`${FOLDER_PREFIX}${folderId}`);

    return result;

  } catch (error) {
    throw new Error(error.message || "Folder deletion failed");
  }
};


// =====================================================
// AUDIO SERVICES
// =====================================================

exports.createAudio = async ({
  folder_id,
  title,
  duration_seconds,
  file,
}) => {

  if (!folder_id || !title || !file) {
    throw new Error("folder_id, title and audio file are required");
  }

  const extension = file.originalname.split(".").pop();
  const key = `audio/${folder_id}/${crypto.randomUUID()}.${extension}`;

  try {

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const result = await worker.post(`/audio-manager/audios`, {
      folder_id,
      title,
      audio_key: key,
      duration_seconds: duration_seconds || null,
    });

    await redis.del(`${FOLDER_PREFIX}${folder_id}`);

    return result;

  } catch (error) {

    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
      })
    );

    throw new Error(error.message || "Audio upload failed");
  }
};


exports.updateAudio = async ({
  id,
  title,
  duration_seconds,
  file,
}) => {

  try {

    const existing = await worker.get(`/audio-manager/audios/${id}`);

    if (!existing) {
      throw new Error("Audio not found");
    }

    let newKey = existing.audio_key;

    if (file) {

      const extension = file.originalname.split(".").pop();

      newKey = `audio/${existing.folder_id}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}.${extension}`;

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: newKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      if (existing.audio_key) {

        await r2.send(
          new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET,
            Key: existing.audio_key,
          })
        );
      }
    }

    const result = await worker.put(`/audio-manager/audios/${id}`, {
      title: title || existing.title,
      duration_seconds:
        duration_seconds || existing.duration_seconds,
      audio_key: newKey,
    });

    await redis.del(`${FOLDER_PREFIX}${existing.folder_id}`);

    return result;

  } catch (error) {
    throw new Error(error.message || "Audio update failed");
  }
};


exports.deleteAudio = async (id) => {

  try {

    const existing = await worker.get(`/audio-manager/audios/${id}`);

    if (!existing) {
      throw new Error("Audio not found");
    }

    if (existing.audio_key) {

      await r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: existing.audio_key,
        })
      );
    }

    const result = await worker.delete(`/audio-manager/audios/${id}`);

    await redis.del(`${FOLDER_PREFIX}${existing.folder_id}`);

    return result;

  } catch (error) {
    throw new Error(error.message || "Audio deletion failed");
  }
};