const nodemailer = require("nodemailer");

const createMailTransport = (settings = {}) => {
  if (!settings.smtp_host || !settings.smtp_port || !settings.smtp_user) {
    return null;
  }

  return nodemailer.createTransport({
    host: settings.smtp_host,
    port: Number(settings.smtp_port) || 587,
    secure: Number(settings.smtp_secure) === 1,
    auth: {
      user: settings.smtp_user,
      pass: settings.smtp_pass || "",
    },
  });
};

module.exports = {
  createMailTransport,
};
