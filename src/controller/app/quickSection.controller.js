// controllers/app/quickSection.controller.js

const service = require("../../services/app/quickSection.service");

exports.getQuickSections = async (req, res) => {

  try {

    const data = await service.getQuickSections();

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