// services/app/quickSection.service.js

const worker = require("../../services/admin/worker.service");

exports.getQuickSections = async () => {

  const data = await worker.get("/quick-access");

  return data?.data || data;

};