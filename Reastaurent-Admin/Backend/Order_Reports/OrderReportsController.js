const orderReportsModel = require("./orderReportsModel");
const { generateOrderReportPdf } = require("./pdfService");
const { generateOrderReportExcel, generateOrdersCsv } = require("./excelService");
const { normalizeFilters, validateFilters, normalizeTimezone } = require("./reportUtils");

const getAdminId = (req) => req.auth?.adminId || req.admin?.id || null;

const prepareFilters = async (req) => {
  const restaurant = await orderReportsModel.getRestaurantDetails(getAdminId(req));
  const filters = normalizeFilters(
    req.query,
    normalizeTimezone(restaurant.timezone_name || "Asia/Kolkata")
  );
  const error = validateFilters(filters);

  return {
    restaurant,
    filters,
    error,
  };
};

const sendData = (res, message, data, extra = {}) =>
  res.status(200).json({
    success: true,
    message,
    data,
    ...extra,
  });

const getSummary = async (req, res) => {
  try {
    const { filters, error } = await prepareFilters(req);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const data = await orderReportsModel.getSummary(filters);
    return sendData(res, "Order report summary fetched successfully", data, { filters });
  } catch (error) {
    console.error("Error fetching order report summary:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const { filters, error } = await prepareFilters(req);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const rows = await orderReportsModel.getOrders(filters);
    const totalRecords = rows.length > 0 ? Number(rows[0].total_records) : 0;
    const data = rows.map(({ total_records, ...order }) => order);

    return sendData(res, "Order report orders fetched successfully", data, {
      filters,
      pagination: {
        totalRecords,
        totalPages: totalRecords === 0 ? 0 : Math.ceil(totalRecords / filters.limit),
        currentPage: filters.page,
        limit: filters.limit,
      },
    });
  } catch (error) {
    console.error("Error fetching report orders:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getPayments = async (req, res) => {
  try {
    const { filters, error } = await prepareFilters(req);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const data = await orderReportsModel.getPaymentSummary(filters);
    return sendData(res, "Payment summary fetched successfully", data, { filters });
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getTopProducts = async (req, res) => {
  try {
    const { filters, error } = await prepareFilters(req);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const data = await orderReportsModel.getTopProducts(filters);
    return sendData(res, "Top products fetched successfully", data, { filters });
  } catch (error) {
    console.error("Error fetching top products:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getHourlySales = async (req, res) => {
  try {
    const { filters, error } = await prepareFilters(req);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const data = await orderReportsModel.getHourlySales(filters);
    return sendData(res, "Hourly sales fetched successfully", data, { filters });
  } catch (error) {
    console.error("Error fetching hourly sales:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getFullDashboard = async (req, res) => {
  try {
    const { filters, error } = await prepareFilters(req);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const data = await orderReportsModel.getFullReport(filters, getAdminId(req));
    return sendData(res, "Order reports dashboard fetched successfully", data, { filters });
  } catch (error) {
    console.error("Error fetching reports dashboard:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const exportPdf = async (req, res) => {
  try {
    const { filters, error } = await prepareFilters(req);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const report = await orderReportsModel.getFullReport(filters, getAdminId(req));
    const buffer = await generateOrderReportPdf(report);
    const fileName = `order-report-${filters.fromDate}-to-${filters.toDate}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Error exporting PDF report:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const exportExcel = async (req, res) => {
  try {
    const { filters, error } = await prepareFilters(req);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const report = await orderReportsModel.getFullReport(filters, getAdminId(req));
    const buffer = await generateOrderReportExcel(report);
    const fileName = `order-report-${filters.fromDate}-to-${filters.toDate}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("Error exporting Excel report:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const exportCsv = async (req, res) => {
  try {
    const { filters, error } = await prepareFilters(req);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const orders = await orderReportsModel.getOrders({ ...filters, limit: 1000, page: 1 });
    const csv = generateOrdersCsv(orders);
    const fileName = `order-report-${filters.fromDate}-to-${filters.toDate}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.status(200).send(csv);
  } catch (error) {
    console.error("Error exporting CSV report:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  getSummary,
  getOrders,
  getPayments,
  getTopProducts,
  getHourlySales,
  getFullDashboard,
  exportPdf,
  exportExcel,
  exportCsv,
};
