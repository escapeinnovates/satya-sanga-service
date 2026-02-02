const axios = require("axios");
const { GOOGLE_API_KEY } = require("../config/env");


exports.fetchAudioItems = async (folderId) => {
  const res = await axios.get(
    "https://www.googleapis.com/drive/v3/files",
    {
      params: {
        key: GOOGLE_API_KEY,
        q: `'${folderId}' in parents and trashed=false and (mimeType contains 'audio/' or mimeType='application/vnd.google-apps.folder')`,
        fields: "files(id,name,mimeType,size)",
        orderBy: "folder,name",
      },
    }
  );

  return res.data.files || [];
};
