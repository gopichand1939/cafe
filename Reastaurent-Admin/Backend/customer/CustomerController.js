const bcrypt = require("bcryptjs");
const customerModel = require("./customerModel");
const { publishCustomerChangeSafely } = require("../realtime/customerEvents");

const toRealtimeCustomer = (customer) =>
  customer ? customerModel.sanitizeCustomer(customer) : null;

const normalizePaginationNumber = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
};

const normalizeActiveFlag = (value, fallback = 1) =>
  Number(value) === 0 ? 0 : fallback;

const createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      is_active = 1,
    } = req.body;

    if (!name || !String(name).trim() || !email || !String(email).trim() || !phone || !String(phone).trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email, phone and password are required",
      });
    }

    const normalizedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).trim();
    const normalizedPassword = String(password);
    const normalizedActive = normalizeActiveFlag(is_active, 1);

    if (normalizedPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "password must be at least 6 characters long",
      });
    }

    const passwordHash = await bcrypt.hash(normalizedPassword, 10);
    const customer = await customerModel.createCustomer({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      isActive: normalizedActive,
    });

    if (!customer) {
      return res.status(409).json({
        success: false,
        message: "Customer email or phone already exists",
      });
    }

    await publishCustomerChangeSafely({
      entity: "customer",
      action: "created",
      entityId: customer.id,
      customerId: customer.id,
      entityData: toRealtimeCustomer(customer),
    });

    return res.status(200).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getCustomerList = async (req, res) => {
  try {
    const page = normalizePaginationNumber(req.body.page, 1);
    const limit = normalizePaginationNumber(req.body.limit, 10);
    const offset = (page - 1) * limit;

    const rows = await customerModel.getCustomerList(limit, offset);
    const totalRecords = rows.length > 0 ? Number(rows[0].total_records) : 0;
    const data = rows.map(({ total_records, ...customer }) => customer);
    const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / limit);

    return res.status(200).json({
      success: true,
      message: "Customer list fetched successfully",
      data,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching customer list:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const customer = await customerModel.getCustomerById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Error fetching customer by id:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const {
      id,
      name,
      email,
      phone,
      password = "",
      is_active = 1,
    } = req.body;

    if (!id || !name || !String(name).trim() || !email || !String(email).trim() || !phone || !String(phone).trim()) {
      return res.status(400).json({
        success: false,
        message: "id, name, email and phone are required",
      });
    }

    const existingCustomer = await customerModel.getCustomerForUpdate(id);

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const normalizedPassword = String(password || "").trim();
    if (normalizedPassword && normalizedPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "password must be at least 6 characters long",
      });
    }

    const passwordHash = normalizedPassword
      ? await bcrypt.hash(normalizedPassword, 10)
      : null;

    const result = await customerModel.updateCustomer({
      id,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      passwordHash,
      isActive: normalizeActiveFlag(is_active, 1),
    });

    if (result?.duplicate_email_exists) {
      return res.status(409).json({
        success: false,
        message: "Customer email already exists",
      });
    }

    if (result?.duplicate_phone_exists) {
      return res.status(409).json({
        success: false,
        message: "Customer phone already exists",
      });
    }

    const {
      target_exists,
      duplicate_email_exists,
      duplicate_phone_exists,
      ...updatedCustomer
    } = result || {};

    await publishCustomerChangeSafely({
      entity: "customer",
      action: "updated",
      entityId: updatedCustomer.id,
      customerId: updatedCustomer.id,
      entityData: toRealtimeCustomer(updatedCustomer),
    });

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "id is required",
      });
    }

    const existingCustomer = await customerModel.getCustomerById(id);

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await customerModel.deleteCustomer(id);

    await publishCustomerChangeSafely({
      entity: "customer",
      action: "deleted",
      entityId: existingCustomer.id,
      customerId: existingCustomer.id,
      entityData: toRealtimeCustomer(existingCustomer),
    });

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  createCustomer,
  getCustomerList,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
