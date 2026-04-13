const bcrypt = require("bcryptjs");
const adminModel = require("./adminModel");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiryDate,
  generateResetToken,
  getResetTokenExpiryDate,
  generateSessionId,
  hashToken,
} = require("./tokenService");

const buildAuthResponse = (message, admin, accessToken, refreshToken) => ({
  success: true,
  message,
  data: {
    admin: adminModel.sanitizeAdmin(admin),
    access_token: accessToken,
    refresh_token: refreshToken,
  },
});

const registerAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, confirm_password } = req.body;

    if (!name || !email || !password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: "name, email, password and confirm_password are required",
      });
    }

    if (String(password) !== String(confirm_password)) {
      return res.status(400).json({
        success: false,
        message: "password and confirm_password must match",
      });
    }

    if (String(password).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const totalAdmins = await adminModel.countAdmins();
    if (totalAdmins > 0) {
      return res.status(403).json({
        success: false,
        message: "Admin registration is disabled after the first admin is created",
      });
    }

    const existingAdmin = await adminModel.getAdminByEmail(email);
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "An admin with this email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const createdAdmin = await adminModel.createAdmin({
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : null,
      passwordHash,
    });

    return res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        admin: adminModel.sanitizeAdmin(createdAdmin),
      },
    });
  } catch (error) {
    console.error("Error registering admin:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    const admin = await adminModel.getAdminByEmail(email);
    if (!admin || Number(admin.is_active) !== 1) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(String(password), admin.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const sessionId = generateSessionId();
    const refreshExpiryDate = getRefreshTokenExpiryDate();
    const accessToken = generateAccessToken(admin, sessionId);
    const refreshToken = generateRefreshToken(admin, sessionId);
    const savedAdmin = await adminModel.updateLoginSession(
      admin.id,
      sessionId,
      hashToken(refreshToken),
      refreshExpiryDate
    );

    return res
      .status(200)
      .json(buildAuthResponse("Login successful", savedAdmin, accessToken, refreshToken));
  } catch (error) {
    console.error("Error logging in admin:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const refreshAdminToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: "refresh_token is required",
      });
    }

    const payload = verifyRefreshToken(refresh_token);
    const admin = await adminModel.getAdminForSessionValidation(payload.sub);

    if (
      !admin ||
      Number(admin.is_active) !== 1 ||
      admin.email !== payload.email ||
      admin.current_session_id !== payload.sid ||
      admin.refresh_token_hash !== hashToken(refresh_token) ||
      !admin.session_expires_at ||
      new Date(admin.session_expires_at) <= new Date() ||
      !admin.refresh_token_expires_at ||
      new Date(admin.refresh_token_expires_at) <= new Date()
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const refreshExpiryDate = getRefreshTokenExpiryDate();
    const accessToken = generateAccessToken(admin, payload.sid);
    const newRefreshToken = generateRefreshToken(admin, payload.sid);
    const savedAdmin = await adminModel.updateLoginSession(
      admin.id,
      payload.sid,
      hashToken(newRefreshToken),
      refreshExpiryDate
    );

    return res.status(200).json(
      buildAuthResponse(
        "Token refreshed successfully",
        savedAdmin,
        accessToken,
        newRefreshToken
      )
    );
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

const logoutAdmin = async (req, res) => {
  try {
    const clearedSession = await adminModel.clearSession(req.admin.id, req.auth.sessionId);

    if (!clearedSession) {
      return res.status(400).json({
        success: false,
        message: "Session already expired or invalid",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Error logging out admin:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "email is required",
      });
    }

    const admin = await adminModel.getAdminByEmail(email);
    if (!admin) {
      return res.status(200).json({
        success: true,
        message: "If the email exists, a reset token has been generated",
      });
    }

    const resetToken = generateResetToken();
    await adminModel.setResetPasswordToken(
      email,
      hashToken(resetToken),
      getResetTokenExpiryDate()
    );

    return res.status(200).json({
      success: true,
      message: "Reset token generated successfully",
      data: {
        reset_token: resetToken,
        expires_in_minutes: Number(process.env.RESET_TOKEN_EXPIRES_IN_MINUTES) || 15,
      },
    });
  } catch (error) {
    console.error("Error generating forgot password token:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { reset_token, new_password, confirm_password } = req.body;

    if (!reset_token || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: "reset_token, new_password and confirm_password are required",
      });
    }

    if (String(new_password) !== String(confirm_password)) {
      return res.status(400).json({
        success: false,
        message: "new_password and confirm_password must match",
      });
    }

    const admin = await adminModel.getAdminByResetTokenHash(hashToken(reset_token));
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    const passwordHash = await bcrypt.hash(String(new_password), 10);
    await adminModel.updatePassword(admin.id, passwordHash);

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: "current_password, new_password and confirm_password are required",
      });
    }

    if (String(new_password) !== String(confirm_password)) {
      return res.status(400).json({
        success: false,
        message: "new_password and confirm_password must match",
      });
    }

    const adminWithPassword = await adminModel.getAdminByEmail(req.admin.email);
    const isPasswordValid = await bcrypt.compare(
      String(current_password),
      adminWithPassword.password_hash
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const passwordHash = await bcrypt.hash(String(new_password), 10);
    await adminModel.updatePassword(req.admin.id, passwordHash);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.admin,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  registerAdmin,
  loginAdmin,
  refreshAdminToken,
  logoutAdmin,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
};
