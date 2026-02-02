const rateLimit = require("express-rate-limit");

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                // limit each IP
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = rateLimiter;
