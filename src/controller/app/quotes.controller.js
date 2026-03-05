// controllers/app/quotes.controller.js

const service = require("../../services/app/quotes.service");

exports.getQuotes = async (req, res) => {

  try {

    const data = await service.getQuotes();

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
