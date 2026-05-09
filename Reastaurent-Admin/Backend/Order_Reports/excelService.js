const { Parser } = require("json2csv");

const orderColumns = [
  { header: "Order Number", key: "order_number" },
  { header: "Customer", key: "customer_name" },
  { header: "Phone", key: "customer_phone" },
  { header: "Order Status", key: "order_status" },
  { header: "Payment Status", key: "payment_status" },
  { header: "Payment Method", key: "payment_method" },
  { header: "Items", key: "ordered_items" },
  { header: "Subtotal", key: "subtotal_amount" },
  { header: "Discount", key: "discount_amount" },
  { header: "Tax", key: "tax_amount" },
  { header: "Delivery Fee", key: "delivery_fee" },
  { header: "Total", key: "total_amount" },
  { header: "Created At", key: "created_at" },
];

const generateOrdersCsv = (orders) => {
  const parser = new Parser({
    fields: orderColumns.map((column) => ({
      label: column.header,
      value: column.key,
    })),
  });

  return parser.parse(orders);
};

const addWorksheet = (workbook, name, columns, rows) => {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width || 20,
  }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row));
  return sheet;
};

const generateOrderReportExcel = async (report) => {
  let ExcelJS;

  try {
    ExcelJS = require("exceljs");
  } catch (error) {
    throw new Error("Excel export requires the exceljs package. Run npm install exceljs.");
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Restaurant Admin";
  workbook.created = new Date();

  const summaryRows = Object.entries(report.summary).map(([key, value]) => ({
    metric: key,
    value,
  }));

  addWorksheet(
    workbook,
    "Summary",
    [
      { header: "Metric", key: "metric", width: 28 },
      { header: "Value", key: "value", width: 28 },
    ],
    summaryRows
  );
  addWorksheet(workbook, "Orders", orderColumns, report.orders);
  addWorksheet(
    workbook,
    "Payments",
    [
      { header: "Payment Status", key: "payment_status" },
      { header: "Payment Method", key: "payment_method" },
      { header: "Total Orders", key: "total_orders" },
      { header: "Total Amount", key: "total_amount" },
    ],
    report.payments
  );
  addWorksheet(
    workbook,
    "Top Products",
    [
      { header: "Item Name", key: "item_name", width: 32 },
      { header: "Total Quantity", key: "total_quantity" },
      { header: "Total Sales", key: "total_sales" },
    ],
    report.topProducts
  );
  addWorksheet(
    workbook,
    "Hourly Sales",
    [
      { header: "Hour", key: "hour_label" },
      { header: "Total Orders", key: "total_orders" },
      { header: "Total Sales", key: "total_sales" },
    ],
    report.hourlySales
  );
  addWorksheet(
    workbook,
    "Daily Sales",
    [
      { header: "Date", key: "sales_date" },
      { header: "Orders", key: "total_orders" },
      { header: "Revenue", key: "total_revenue" },
      { header: "Paid", key: "paid_amount" },
      { header: "Tax", key: "tax_amount" },
      { header: "Discount", key: "discount_amount" },
    ],
    report.dailySales
  );

  return workbook.xlsx.writeBuffer();
};

module.exports = {
  generateOrdersCsv,
  generateOrderReportExcel,
  orderColumns,
};
