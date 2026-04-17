const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");
const routes = require("./AllGetRouter");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Static folder for images
app.use("/images", express.static("public"));

// ✅ Response time header (for monitoring)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`⚠️ Slow request: ${req.method} ${req.url} - ${duration}ms`);
    }
  });
  next();
});

app.use("/api", routes);

// ✅ Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const start = Date.now();
    await db.query("SELECT 1");
    res.json({ status: "ok", dbLatency: `${Date.now() - start}ms` });
  } catch (err) {
    res.status(503).json({ status: "error", message: err.message });
  }
});

const PORT = process.env.PORT || 15014;

const startServer = async () => {
  // ✅ Pre-warm DB connection before accepting requests
  console.log("⏳ Warming up database connection...");
  await db.warmUp();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();
