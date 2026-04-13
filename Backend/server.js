require("dotenv").config();

const express = require("express");
const path = require("path");
const categoryRoutes = require("./category/categoryRoutes");
const itemRoutes = require("./items/itemRoutes");

const app = express();

const applyCorsHeaders = (req, res) => {
  const origin = req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Vary", "Origin");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, DeviceID"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
};

app.use((req, res, next) => {
  applyCorsHeaders(req, res);
  next();
});

app.options("*", (req, res) => {
  applyCorsHeaders(req, res);
  return res.sendStatus(204);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/images", express.static(path.join(__dirname, "images")));

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Restaurant backend is running",
  });
});

app.use("/category", categoryRoutes);
app.use("/items", itemRoutes);

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
