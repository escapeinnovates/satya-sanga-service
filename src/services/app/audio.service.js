// services/app/audio.service.js

const worker = require("../../services/admin/worker.service");

/* ======================================================
   GET ROOT AUDIO FOLDERS
====================================================== */

exports.getRootFolders = async () => {

  const data = await worker.get("/app-audio/root");

  return data?.items || data?.folders || [];

};


/* ======================================================
   GET FOLDER CONTENT (SUBFOLDERS + AUDIOS)
====================================================== */

exports.getFolderContent = async (folderId) => {

  const data = await worker.get(`/app-audio/folder/${folderId}`);

  return {
    folders: data?.folders || [],
    audios: data?.audios || []
  };

};