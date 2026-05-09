const express = require("express");
const {
  getSummary,
  getOrders,
  getPayments,
  getTopProducts,
  getHourlySales,
  getFullDashboard,
  exportPdf,
  exportExcel,
  exportCsv,
} = require("./OrderReportsController");

const router = express.Router();

router.get("/summary", getSummary);
router.get("/orders", getOrders);
router.get("/payments", getPayments);
router.get("/top-products", getTopProducts);
router.get("/hourly-sales", getHourlySales);
router.get("/dashboard", getFullDashboard);
router.get("/export/pdf", exportPdf);
router.get("/export/excel", exportExcel);
router.get("/export/csv", exportCsv);

module.exports = router;
