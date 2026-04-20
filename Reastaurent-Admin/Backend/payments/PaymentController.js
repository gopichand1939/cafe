const paymentModel = require("./paymentModel");

const normalizePageNumber = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
};

const getPaymentList = async (req, res) => {
  try {
    const page = normalizePageNumber(req.body.page, 1);
    const limit = normalizePageNumber(req.body.limit, 10);
    const status = req.body.status ? String(req.body.status).trim() : "";
    const gateway = req.body.gateway ? String(req.body.gateway).trim() : "";
    const isPaymentSuccess =
      req.body.is_payment_success === "" ||
      req.body.is_payment_success === undefined ||
      req.body.is_payment_success === null
        ? null
        : Number(req.body.is_payment_success) === 1
          ? 1
          : 0;
    const orderId = req.body.order_id ? Number(req.body.order_id) : null;
    const customerId = req.body.customer_id ? Number(req.body.customer_id) : null;
    const search = req.body.search ? String(req.body.search).trim() : "";

    const rows = await paymentModel.getPaymentList({
      page,
      limit,
      status,
      gateway,
      isPaymentSuccess,
      orderId,
      customerId,
      search,
    });

    const totalRecords = rows.length > 0 ? Number(rows[0].total_records) : 0;
    const data = rows.map(({ total_records, ...payment }) => payment);
    const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      message: "Payment list fetched successfully",
      data,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching payment list:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const payment = await paymentModel.getPaymentById(Number(id));

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Error fetching payment by id:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getPaymentSummary = async (_req, res) => {
  try {
    const summary = await paymentModel.getPaymentSummary();

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  getPaymentList,
  getPaymentById,
  getPaymentSummary,
};
