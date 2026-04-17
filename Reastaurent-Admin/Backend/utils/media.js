const IMAGE_ROUTE_PREFIX = "/images";

const trimTrailingSlash = (value = "") => value.replace(/\/+$/g, "");

const normalizeStoredImagePath = (value = "") =>
  String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/g, "");

const detectProvider = (storedPath) => {
  if (/res\.cloudinary\.com/i.test(String(storedPath || ""))) {
    return "cloudinary";
  }

  if (/^(https?:)?\/\//i.test(String(storedPath || ""))) {
    return "remote";
  }

  return process.env.IMAGE_STORAGE_PROVIDER || "local";
};

const getPublicAssetBaseUrl = (req) => {
  const configuredBaseUrl = trimTrailingSlash(process.env.PUBLIC_ASSET_BASE_URL || "");

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  const protocol = req.protocol || "http";
  const host = req.get("host");

  return host ? `${protocol}://${host}` : "";
};

const buildImageUrl = (req, storedPath) => {
  if (!storedPath) {
    return null;
  }

  if (/^(https?:)?\/\//i.test(storedPath) || /^data:/i.test(storedPath)) {
    return storedPath;
  }

  const normalizedPath = normalizeStoredImagePath(storedPath);
  const baseUrl = getPublicAssetBaseUrl(req);

  return baseUrl
    ? `${baseUrl}${IMAGE_ROUTE_PREFIX}/${normalizedPath}`
    : `${IMAGE_ROUTE_PREFIX}/${normalizedPath}`;
};

const attachImageFields = (req, entity, imageFields = []) => {
  if (!entity) {
    return entity;
  }

  return imageFields.reduce((result, fieldName) => {
    const storedPath = result[fieldName] || null;

    return {
      ...result,
      [`${fieldName}_url`]: buildImageUrl(req, storedPath),
      [`${fieldName}_media`]: storedPath
        ? {
            path: normalizeStoredImagePath(storedPath),
            url: buildImageUrl(req, storedPath),
            provider: detectProvider(storedPath),
          }
        : null,
    };
  }, { ...entity });
};

module.exports = {
  attachImageFields,
  buildImageUrl,
  normalizeStoredImagePath,
};
