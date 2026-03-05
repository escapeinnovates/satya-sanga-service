// services/app/quotes.service.js

const worker = require("../../services/admin/worker.service");

exports.getQuotes = async () => {

  const data = await worker.get("/quotes");

  return data?.data || data;

};