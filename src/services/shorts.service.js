const axios = require("axios");
const { GOOGLE_API_KEY } = require("../config/env");

/**
 * Fetch YouTube Shorts for a channel
 * Uses Search API with videoDuration=short
 */
exports.fetchShorts = async (channelId) => {
  const res = await axios.get(
    "https://www.googleapis.com/youtube/v3/search",
    {
      params: {
        key: GOOGLE_API_KEY,
        part: "snippet",
        channelId,
        maxResults: 25,
        type: "video",
        videoDuration: "short",
        order: "date",
      },
    }
  );

  return res.data;
};
