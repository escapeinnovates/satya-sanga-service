// controllers/app/announcements.controller.js

const service = require("../../services/app/announcements.service");

exports.getAnnouncements = async (req, res) => {

  try {

    const data = await service.getAnnouncements();

    res.json({
      success: true,
      data
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements"
    });

  }

};