const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const router = express.Router();

const WORKER = process.env.WORKER_BASE_URL;

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const response = await axios.get(
      `${WORKER}/users/email/${encodeURIComponent(email)}`
    );

    const user = response.data;


    if (!user || user.is_active !== 1) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


router.get("/me", (req, res) => {
  try {
    const token = req.cookies.admin_token;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return res.json({
      id: decoded.id,
      role: decoded.role,
    });

  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("admin_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  return res.json({ success: true });
});

module.exports = router;
