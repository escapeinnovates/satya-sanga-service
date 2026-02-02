const axios = require("axios");
const { GOOGLE_API_KEY } = require("../config/env");

/**
 * Fetch quotes from Google Sheet
 */
exports.fetchQuotesFromSheet = async (sheetId, sheetName) => {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}`;

  const res = await axios.get(url, {
    params: {
      key: GOOGLE_API_KEY,
    },
  });

  const rows = res.data.values || [];

  if (rows.length === 0) return [];

  const headers = rows[0];
  const dataRows = rows.slice(1);

  // Convert rows → objects
  return dataRows.map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || "";
    });
    return obj;
  });
};
