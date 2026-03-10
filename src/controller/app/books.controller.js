// controllers/app/books.controller.js

const service = require("../../services/app/books.service");

// ---------------- GET ALL BOOKS ----------------
exports.getBooks = async (req, res) => {
  try {

    const data = await service.getBooks();

    res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error("GET BOOKS ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch books"
    });

  }
};


// ---------------- GET BOOK BY ID ----------------
exports.getBookById = async (req, res) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Book ID is required"
      });
    }

    const data = await service.getBookById(id);

    res.json({
      success: true,
      data
    });

  } catch (err) {

    console.error("GET BOOK ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch book"
    });

  }
};