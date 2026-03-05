// controllers/app/books.controller.js

const service = require("../../services/app/books.service");

exports.getBooks = async (req, res) => {

  try {

    const data = await service.getBooks();

    res.json({
      success: true,
      data
    });

  } catch (err) {

    res.status(500).json({
      success: false
    });

  }

};