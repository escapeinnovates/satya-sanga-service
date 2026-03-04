const axios = require("axios");
const { GOOGLE_API_KEY } = require("../config/env");

/**
 * 🔹 Fetch items from ONE folder (folders + images)
 */
exports.fetchDriveItems = async (folderId) => {
  const res = await axios.get(
    "https://www.googleapis.com/drive/v3/files",
    {
      params: {
        key: GOOGLE_API_KEY,
        q: `'${folderId}' in parents and (mimeType contains 'image/' or mimeType='application/vnd.google-apps.folder')`,
        fields: "files(id,name,mimeType)",
        orderBy: "folder,name",
      },
    }
  );

  return res.data.files || [];
};

/**
 * 🔹 Fetch folder metadata (for title)
 */
exports.fetchFolderMeta = async (folderId) => {
  const res = await axios.get(
    `https://www.googleapis.com/drive/v3/files/${folderId}`,
    {
      params: {
        key: GOOGLE_API_KEY,
        fields: "id,name",
      },
    }
  );

  return res.data;
};

exports.listBooks = async (rootFolderId) => {
  const items = await exports.fetchDriveItems(rootFolderId);

  // Only folders are books
  const folders = items.filter(
    (i) => i.mimeType === "application/vnd.google-apps.folder"
  );

  const books = [];

  for (const folder of folders) {
    const childItems = await exports.fetchDriveItems(folder.id);

    const images = childItems.filter(
      (i) => i.mimeType.startsWith("image/")
    );

    if (images.length === 0) continue; // skip empty folders

    books.push({
      id: folder.id,
      title: folder.name,
      coverImageUrl: `/api/books/${folder.id}/cover`,
    });
  }

  return books;
};


