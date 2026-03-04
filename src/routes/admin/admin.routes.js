const express = require("express");
const axios = require("axios");

const router = express.Router();

const WORKER = process.env.WORKER_BASE_URL;

/*
  This admin route acts as a proxy to the Worker.
  All requests under /admin/* are JWT protected already.
*/

// Generic proxy helper
const forwardRequest = async (req, res) => {
  try {
    const workerUrl = `${WORKER}${req.originalUrl.replace("/admin", "")}`;

    const response = await axios({
      method: req.method,
      url: workerUrl,
      data: req.body,
      params: req.query
    });

    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }

    console.error(err);
    res.status(500).json({ message: "Worker connection error" });
  }
};

// Handle all admin routes
router.use(forwardRequest);

module.exports = router;
