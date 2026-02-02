const express = require("express");
const axios = require("axios");
const { GOOGLE_API_KEY } = require("../config/env");



/**
 * 🔹 Internal helper: fetch items from ONE folder
 */
exports.fetchDriveItems = async (folderId) => {
  const res = await axios.get(
    "https://www.googleapis.com/drive/v3/files",
    {
      params: {
        key: GOOGLE_API_KEY,
        q: `'${folderId}' in parents and (mimeType='application/pdf' or mimeType='application/vnd.google-apps.folder')`,
        fields: "files(id,name,mimeType,thumbnailLink)",
        orderBy: "folder,name",
      },
    }
  );

  return res.data.files || [];
};

/**
 * 🔁 Internal helper: recursive fetch (folders + PDFs)
 */
exports.fetchRecursive = async (folderId, allItems = []) => {
  const items = await fetchDriveItems(folderId);

  for (const item of items) {
    allItems.push(item);

    if (item.mimeType === "application/vnd.google-apps.folder") {
      await fetchRecursive(item.id, allItems);
    }
  }

  return allItems;
};