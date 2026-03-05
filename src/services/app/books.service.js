// services/app/books.service.js

const worker = require("../../services/admin/worker.service");

exports.getBooks = async () => {

  const data = await worker.get("/books");

  return data?.data || data;

};