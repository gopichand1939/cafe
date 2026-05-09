const { formatCurrency, formatDateTime } = require("./reportUtils");

const addSectionTitle = (doc, title) => {
  doc.moveDown(0.8);
  doc.fontSize(13).font("Helvetica-Bold").text(title);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(9);
};

const addKeyValueRows = (doc, rows) => {
  rows.forEach(([label, value]) => {
    doc.font("Helvetica-Bold").text(`${label}: `, { continued: true });
    doc.font("Helvetica").text(value === null || value === undefined ? "-" : String(value));
  });
};

const addTable = (doc, columns, rows, maxRows = 12) => {
  const visibleRows = rows.slice(0, maxRows);
  const widths = columns.map((column) => column.width || 110);
  const startX = doc.x;

  doc.font("Helvetica-Bold").fontSize(8);
  columns.forEach((column, index) => {
    doc.text(column.header, startX + widths.slice(0, index).reduce((sum, width) => sum + width, 0), doc.y, {
      width: widths[index],
    });
  });
  doc.moveDown(0.8);
  doc.font("Helvetica").fontSize(8);

  visibleRows.forEach((row) => {
    const y = doc.y;
    columns.forEach((column, index) => {
      const x = startX + widths.slice(0, index).reduce((sum, width) => sum + width, 0);
      doc.text(row[column.key] === null || row[column.key] === undefined ? "-" : String(row[column.key]), x, y, {
        width: widths[index],
        ellipsis: true,
      });
    });
    doc.moveDown(0.7);
  });

  if (rows.length > maxRows) {
    doc.text(`Showing ${maxRows} of ${rows.length} rows.`);
  }
};

const generateOrderReportPdf = (report) =>
  new Promise((resolve, reject) => {
    let PDFDocument;

    try {
      PDFDocument = require("pdfkit");
    } catch (error) {
      reject(new Error("PDF export requires the pdfkit package. Run npm install pdfkit."));
      return;
    }

    const doc = new PDFDocument({ margin: 42, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).font("Helvetica-Bold").text("Order Sales Report");
    doc.fontSize(10).font("Helvetica").text(report.restaurant.restaurant_name || "Restaurant");
    doc.text(report.restaurant.institution_name || "");
    doc.text(`Timezone: ${report.filters.timezone}`);
    doc.text(`Date Range: ${report.filters.fromDate} to ${report.filters.toDate}`);

    addSectionTitle(doc, "Sales Overview");
    addKeyValueRows(doc, [
      ["Total Orders", report.summary.total_orders],
      ["Total Revenue", formatCurrency(report.summary.total_revenue)],
      ["Paid Amount", formatCurrency(report.summary.paid_amount)],
      ["COD Pending", formatCurrency(report.summary.cod_pending_amount)],
      ["Average Order Value", formatCurrency(report.summary.average_order_value)],
      ["Peak Sales Hour", report.summary.peak_sales_hour || "-"],
    ]);

    addSectionTitle(doc, "Order Summary");
    addKeyValueRows(doc, [
      ["Delivered", report.summary.total_delivered],
      ["Cancelled", report.summary.total_cancelled],
      ["Pending", report.summary.pending_orders],
      ["Top Customer", report.summary.top_customer || "-"],
    ]);

    addSectionTitle(doc, "Payment Summary");
    addTable(
      doc,
      [
        { header: "Status", key: "payment_status", width: 95 },
        { header: "Method", key: "payment_method", width: 130 },
        { header: "Orders", key: "total_orders", width: 65 },
        { header: "Amount", key: "total_amount", width: 100 },
      ],
      report.payments
    );

    addSectionTitle(doc, "Revenue Breakdown");
    addKeyValueRows(doc, [
      ["Subtotal", formatCurrency(report.taxSummary.subtotal_amount)],
      ["Tax", formatCurrency(report.taxSummary.tax_amount)],
      ["Discounts", formatCurrency(report.taxSummary.discount_amount)],
      ["Delivery Fee", formatCurrency(report.taxSummary.delivery_fee)],
      ["Total", formatCurrency(report.taxSummary.total_amount)],
    ]);

    addSectionTitle(doc, "Top Selling Items");
    addTable(
      doc,
      [
        { header: "Item", key: "item_name", width: 190 },
        { header: "Qty", key: "total_quantity", width: 70 },
        { header: "Sales", key: "total_sales", width: 110 },
      ],
      report.topProducts
    );

    addSectionTitle(doc, "Recent Orders");
    addTable(
      doc,
      [
        { header: "Order", key: "order_number", width: 100 },
        { header: "Customer", key: "customer_name", width: 120 },
        { header: "Status", key: "order_status", width: 80 },
        { header: "Payment", key: "payment_status", width: 75 },
        { header: "Total", key: "total_amount", width: 70 },
      ],
      report.orders,
      15
    );

    addSectionTitle(doc, "Payment Pending Table");
    addTable(
      doc,
      [
        { header: "Order", key: "order_number", width: 110 },
        { header: "Customer", key: "customer_name", width: 140 },
        { header: "Method", key: "payment_method", width: 120 },
        { header: "Total", key: "total_amount", width: 80 },
      ],
      report.codPending,
      12
    );

    doc.moveDown();
    doc.fontSize(8).text(`Generated: ${formatDateTime(new Date(), report.filters.timezone)}`, {
      align: "right",
    });
    doc.end();
  });

module.exports = {
  generateOrderReportPdf,
};
