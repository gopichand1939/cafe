require("dotenv").config();

const express = require("express");
const path = require("path");
const categoryRoutes = require("./category/categoryRoutes");
const itemRoutes = require("./items/itemRoutes");
const addonRoutes = require("./addons/addonRoutes");
const adminRoutes = require("./Login/adminRoutes");
const adminModel = require("./Login/adminModel");
const menuAccessModel = require("./Access/menuAccessModel");
const restaurantSettingsRoutes = require("./restaurant/restaurantSettingsRoutes");
const restaurantSettingsModel = require("./restaurant/restaurantSettingsModel");
const customerRoutes = require("./customer/customerRoutes");
const orderRoutes = require("./orders/orderRoutes");
const notificationRoutes = require("./notifications/notificationRoutes");
const { startOrderChangeSubscriber } = require("./realtime/orderChangeSubscriber");
const { startCustomerChangeSubscriber } = require("./realtime/customerChangeSubscriber");

const app = express();
const imageCacheMaxAge = Number(process.env.IMAGE_CACHE_MAX_AGE || 604800);

app.set("trust proxy", true);

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
app.use(
  "/images",
  express.static(path.join(__dirname, "images"), {
    maxAge: imageCacheMaxAge * 1000,
    immutable: true,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", `public, max-age=${imageCacheMaxAge}, immutable`);
    },
  })
);

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Restaurant backend is running",
  });
});

app.use("/category", categoryRoutes);
app.use("/items", itemRoutes);
app.use("/addons", addonRoutes);
app.use("/admin", adminRoutes);
app.use("/restaurant", restaurantSettingsRoutes);
app.use("/customer", customerRoutes);
app.use("/orders", orderRoutes);
app.use("/notifications", notificationRoutes);

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    await adminModel.ensureAdminTable();
    await menuAccessModel.ensureAccessControlData();
    await restaurantSettingsModel.ensureRestaurantSettingsTable();
    startOrderChangeSubscriber();
    startCustomerChangeSubscriber();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
