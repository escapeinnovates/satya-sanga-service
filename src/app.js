const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// const youtubeRoutes = require("./routes/youtube.routes");
const youtubeAppRoutes = require("./routes/app/youtube.routes");
const announcementsAppRoutes = require("./routes/app/announcements.routes");
const quotesAppRoutes = require("./routes/app/quotes.routes");
const booksAppRoutes = require("./routes/app/books.routes");
const audioAppRoutes = require("./routes/app/audio.routes");
const quickAppSectionRoutes = require("./routes/app/quickSection.routes");


// const driveRoutes = require("./routes/drive.routes");
// const driveAudioRoutes = require("./routes/drive.audio.routes");
// const youtubeShortsRoutes = require("./routes/shorts.routes");
// const sheetQuotesRoutes = require("./routes/sheets.routes");
// const booksPublicRoutes = require("./routes/books.public.routes");

const authRoutes = require("./routes/auth.routes");   // NEW
const usersRoutes = require("./routes/admin/user.routes");
const announcementsRoutes = require("./routes/admin/announcements.routes");
const booksRoutes = require("./routes/admin/books.routes");
const flipbook = require("./routes/app/flipbook.routes");
const audioManagerRoutes = require("./routes/admin/audioManager.routes");
const quickSectionroutes = require("./routes/admin/quickSection.routes");

const verifyHmac = require("./middleware/verifyHmac");
const { requireAdmin } = require("./middleware/auth"); // NEW

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://192.168.31.207:5173"
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});


// ------------------------------
// 🌍 PUBLIC APP ROUTES (No Auth)
// ------------------------------

// app.use("/api/books", booksPublicRoutes);


// ------------------------------
// 🔐 ADMIN AUTH ROUTES
// ------------------------------
app.use("/api/flipbook", flipbook);
app.use("/api/quick/flipbook", quickAppSectionRoutes);

app.use("/auth", authRoutes);

// Protect everything under /admin
app.use("/admin/users", usersRoutes);
app.use("/admin/announcements", requireAdmin, announcementsRoutes);
app.use("/admin/quotes", requireAdmin, require("./routes/admin/quotes.routes"));
app.use("/admin/books", requireAdmin, booksRoutes);
app.use("/admin/audio-manager", requireAdmin, audioManagerRoutes);
app.use("/admin/quick-section", requireAdmin, quickSectionroutes);
app.use("/admin/youtube", requireAdmin, require("./routes/admin/youtubeMeta.routes"));


// ------------------------------
// 🔒 HMAC Protected Routes
// ------------------------------

app.use("/api", verifyHmac);

app.use("/api/youtube", youtubeAppRoutes);
app.use("/api/announcements", announcementsAppRoutes);
app.use("/api/quotes", quotesAppRoutes);  
app.use("/api/books", booksAppRoutes);
app.use("/api/audio", audioAppRoutes);
app.use("/api/quick-sections", quickAppSectionRoutes);



// app.use("/api/sheets", sheetQuotesRoutes);
// app.use("/api/drive", driveRoutes);
// // app.use("/api/youtube", youtubeRoutes);
// app.use("/api/drive-audio", driveAudioRoutes);
// app.use("/api/youtube-shorts", youtubeShortsRoutes);


// ------------------------------

app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

module.exports = app;
