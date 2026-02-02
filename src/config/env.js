const dotenv = require("dotenv");

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.local";

dotenv.config({ path: envFile });


module.exports = {
  PORT: process.env.PORT,
  REDIS_URL: process.env.REDIS_URL,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  APP_SECRET: process.env.APP_SECRET,
};
