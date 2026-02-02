const crypto = require("crypto");

module.exports = function verifyHmac(req, res, next) {
  const signature = req.headers["x-signature"];
  const timestamp = req.headers["x-timestamp"];

  if (!signature || !timestamp) {
    return res.status(401).json({ error: "Missing HMAC headers" });
  }

  // ⏱️ Replay protection (5 min)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 300) {
    return res.status(401).json({ error: "Request expired" });
  }

  // 🔑 SAME secret everywhere
  const secret = process.env.HMAC_SECRET;

  // 🔒 IMPORTANT: PATH ONLY (no query string)
  const path = req.originalUrl.split("?")[0];

  const payload = `${req.method}\n${path}\n${timestamp}`;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (expectedSignature !== signature) {
    console.log("❌ HMAC MISMATCH");
    console.log("PATH:", path);
    console.log("PAYLOAD:", payload);
    console.log("EXPECTED:", expectedSignature);
    console.log("GOT:", signature);
    return res.status(401).json({ error: "Invalid signature" });
  }

  next();
};
