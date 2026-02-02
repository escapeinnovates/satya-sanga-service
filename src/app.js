const express = require("express");
const cors = require("cors");

const youtubeRoutes = require("./routes/youtube.routes");
const driveRoutes = require("./routes/drive.routes");
const driveAudioRoutes = require("./routes/drive.audio.routes");
const youtubeShortsRoutes =
  require("./routes/shorts.routes");

const sheetQuotesRoutes =
  require("./routes/sheets.routes");
const verifyHmac = require("./middleware/verifyHmac");


const app = express();


app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});

// 🚨 TEMPORARILY REMOVE rateLimiter
// app.use(rateLimiter);
// 🔐 Protect ALL APIs
app.use("/api", verifyHmac);

app.use("/api/sheets", sheetQuotesRoutes);
app.use("/api/drive", driveRoutes);
app.use("/api/youtube", youtubeRoutes);
app.use("/api/drive-audio", driveAudioRoutes);
app.use("/api/youtube-shorts", youtubeShortsRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

module.exports = app;
