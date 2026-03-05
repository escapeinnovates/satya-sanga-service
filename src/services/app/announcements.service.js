// services/app/announcements.service.js

const worker = require("../../services/admin/worker.service");

exports.getAnnouncements = async () => {

  const data = await worker.get("/announcements");

  return data?.data || data;

};