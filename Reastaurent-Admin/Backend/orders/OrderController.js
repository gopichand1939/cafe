const orderModel = require("./orderModel");
const { publishOrderChangeSafely } = require("../realtime/orderEvents");

const normalizePositiveNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const normalizePageNumber = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
};

const buildOrderRealtimePayload = (order) =>
  order
    ? {
        id: order.id,
        order_number: order.order_number,
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        order_status: order.order_status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        currency_code: order.currency_code,
        item_count: order.item_count,
        total_amount: order.total_amount,
        created_at: order.created_at,
        updated_at: order.updated_at,
      }
    : null;

const validateAndNormalizeItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      error: "At least one order item is required",
    };
  }

  const normalizedItems = [];

  for (const item of items) {
    const quantity = normalizePositiveNumber(item.quantity, 0);
    const unitPrice = normalizePositiveNumber(item.unit_price, 0);
    const discountPrice =
      item.discount_price === null || item.discount_price === undefined || item.discount_price === ""
        ? null
        : normalizePositiveNumber(item.discount_price, 0);
    const addonAmount = normalizePositiveNumber(item.addon_amount, 0);
    const finalUnitPrice =
      discountPrice !== null && discountPrice < unitPrice ? discountPrice : unitPrice;

    if (!item.item_id || !item.item_name || quantity < 1 || unitPrice < 0) {
      return {
        error:
          "Each item must include item_id, item_name, quantity greater than zero, and unit_price",
      };
    }

    normalizedItems.push({
      item_id: Number(item.item_id),
      category_id: item.category_id ? Number(item.category_id) : null,
      item_name: String(item.item_name).trim(),
      item_description: item.item_description ? String(item.item_description).trim() : "",
      item_image: item.item_image ? String(item.item_image).trim() : "",
      quantity,
      unit_price: Number(unitPrice.toFixed(2)),
      discount_price:
        discountPrice === null ? null : Number(discountPrice.toFixed(2)),
      final_unit_price: Number(finalUnitPrice.toFixed(2)),
      addon_amount: Number(addonAmount.toFixed(2)),
      line_total: Number(((finalUnitPrice + addonAmount) * quantity).toFixed(2)),
      selected_addons: Array.isArray(item.selected_addons) ? item.selected_addons : [],
      item_notes: item.item_notes ? String(item.item_notes).trim() : "",
    });
  }

  return {
    items: normalizedItems,
  };
};

const createOrder = async (req, res) => {
  try {
    const {
      customer_id,
      items,
      payment_method = "cash_on_delivery",
      payment_status = "pending",
      order_status = "placed",
      currency_code = "INR",
      order_notes = "",
      delivery_address = {},
      tax_amount = 0,
      delivery_fee = 0,
    } = req.body;

    if (!customer_id) {
      return res.status(400).json({
        success: false,
        message: "customer_id is required",
      });
    }

    if (!orderModel.ORDER_STATUS_VALUES.includes(order_status)) {
      return res.status(400).json({
        success: false,
        message: `order_status must be one of: ${orderModel.ORDER_STATUS_VALUES.join(", ")}`,
      });
    }

    if (!orderModel.PAYMENT_STATUS_VALUES.includes(payment_status)) {
      return res.status(400).json({
        success: false,
        message: `payment_status must be one of: ${orderModel.PAYMENT_STATUS_VALUES.join(", ")}`,
      });
    }

    const normalizedItemsResult = validateAndNormalizeItems(items);
    if (normalizedItemsResult.error) {
      return res.status(400).json({
        success: false,
        message: normalizedItemsResult.error,
      });
    }

    const customer = await orderModel.getCustomerById(customer_id);
    if (!customer || Number(customer.is_active) !== 1) {
      return res.status(404).json({
        success: false,
        message: "Active customer not found",
      });
    }

    const normalizedItems = normalizedItemsResult.items;
    const subtotalAmount = Number(
      normalizedItems
        .reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
        .toFixed(2)
    );
    const discountAmount = Number(
      normalizedItems
        .reduce((sum, item) => {
          const discountPerUnit =
            item.discount_price !== null
              ? Math.max(item.unit_price - item.discount_price, 0)
              : 0;
          return sum + discountPerUnit * item.quantity;
        }, 0)
        .toFixed(2)
    );
    const addonAmount = Number(
      normalizedItems
        .reduce((sum, item) => sum + item.addon_amount * item.quantity, 0)
        .toFixed(2)
    );
    const normalizedTaxAmount = Number(normalizePositiveNumber(tax_amount, 0).toFixed(2));
    const normalizedDeliveryFee = Number(
      normalizePositiveNumber(delivery_fee, 0).toFixed(2)
    );
    const totalAmount = Number(
      (
        subtotalAmount -
        discountAmount +
        addonAmount +
        normalizedTaxAmount +
        normalizedDeliveryFee
      ).toFixed(2)
    );

    const order = await orderModel.createOrder({
      customer,
      orderStatus: order_status,
      paymentStatus: payment_status,
      paymentMethod: String(payment_method).trim() || "cash_on_delivery",
      currencyCode: String(currency_code).trim() || "INR",
      orderNotes: String(order_notes || "").trim(),
      deliveryAddress:
        delivery_address && typeof delivery_address === "object" ? delivery_address : {},
      items: normalizedItems,
      subtotalAmount,
      discountAmount,
      addonAmount,
      taxAmount: normalizedTaxAmount,
      deliveryFee: normalizedDeliveryFee,
      totalAmount,
    });

    await publishOrderChangeSafely({
      entity: "order",
      action: "created",
      entityId: order.id,
      orderId: order.id,
      customerId: order.customer_id,
      entityData: buildOrderRealtimePayload(order),
    });

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getOrderList = async (req, res) => {
  try {
    const page = normalizePageNumber(req.body.page, 1);
    const limit = normalizePageNumber(req.body.limit, 10);
    const status = req.body.status ? String(req.body.status).trim() : "";
    const customerId = req.body.customer_id ? Number(req.body.customer_id) : null;
    const search = req.body.search ? String(req.body.search).trim() : "";

    if (status && !orderModel.ORDER_STATUS_VALUES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${orderModel.ORDER_STATUS_VALUES.join(", ")}`,
      });
    }

    const rows = await orderModel.getOrderList({
      page,
      limit,
      status,
      customerId,
      search,
    });

    const totalRecords = rows.length > 0 ? Number(rows[0].total_records) : 0;
    const data = rows.map(({ total_records, ...order }) => order);
    const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      message: "Order list fetched successfully",
      data,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching order list:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const order = await orderModel.getOrderById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order by id:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id, order_status = "", payment_status = "" } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    if (
      order_status &&
      !orderModel.ORDER_STATUS_VALUES.includes(String(order_status).trim())
    ) {
      return res.status(400).json({
        success: false,
        message: `order_status must be one of: ${orderModel.ORDER_STATUS_VALUES.join(", ")}`,
      });
    }

    if (
      payment_status &&
      !orderModel.PAYMENT_STATUS_VALUES.includes(String(payment_status).trim())
    ) {
      return res.status(400).json({
        success: false,
        message: `payment_status must be one of: ${orderModel.PAYMENT_STATUS_VALUES.join(", ")}`,
      });
    }

    const existingOrder = await orderModel.getOrderById(id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const updatedOrder = await orderModel.updateOrderStatus({
      id,
      orderStatus: order_status ? String(order_status).trim() : "",
      paymentStatus: payment_status ? String(payment_status).trim() : "",
    });

    await publishOrderChangeSafely({
      entity: "order",
      action: "updated",
      entityId: updatedOrder.id,
      orderId: updatedOrder.id,
      customerId: updatedOrder.customer_id,
      entityData: buildOrderRealtimePayload(updatedOrder),
    });

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const existingOrder = await orderModel.getOrderById(id);
    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    await orderModel.deleteOrder(id);

    await publishOrderChangeSafely({
      entity: "order",
      action: "deleted",
      entityId: existingOrder.id,
      orderId: existingOrder.id,
      customerId: existingOrder.customer_id,
      entityData: buildOrderRealtimePayload(existingOrder),
    });

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  createOrder,
  getOrderList,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
};
