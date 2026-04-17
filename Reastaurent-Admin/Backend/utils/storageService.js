const fs = require("fs");
const path = require("path");
const { v2: cloudinary } = require("cloudinary");

const IMAGE_ROUTE_PREFIX = "/images";
const LOCAL_IMAGE_ROOT = path.join(__dirname, "..", "images");

const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/g, "");

const normalizeStoredPath = (value = "") =>
  String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/g, "");

const sanitizeBaseName = (value = "") =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getFileExtension = (file) =>
  path.extname(file?.originalname || "").toLowerCase() || "";

const getCloudinaryConfig = () => {
  if (process.env.CLOUDINARY_URL) {
    return { secure: true };
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary environment variables are missing");
  }

  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  };
};

const ensureCloudinaryConfigured = () => {
  cloudinary.config(getCloudinaryConfig());
};

const ensureDirectory = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
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

const buildLocalAssetUrl = (req, storedPath) => {
  const normalizedPath = normalizeStoredPath(storedPath);
  const baseUrl = getPublicAssetBaseUrl(req);

  return baseUrl
    ? `${baseUrl}${IMAGE_ROUTE_PREFIX}/${normalizedPath}`
    : `${IMAGE_ROUTE_PREFIX}/${normalizedPath}`;
};

const uploadLocalImage = async (req, file, folderName) => {
  const extension = getFileExtension(file);
  const baseName = sanitizeBaseName(path.basename(file.originalname || folderName, extension));
  const fileName = `${baseName || folderName}-${Date.now()}${extension}`;
  const relativePath = normalizeStoredPath(path.posix.join(folderName, fileName));
  const absoluteDirectory = path.join(LOCAL_IMAGE_ROOT, folderName);
  const absoluteFilePath = path.join(LOCAL_IMAGE_ROOT, relativePath);

  ensureDirectory(absoluteDirectory);
  await fs.promises.writeFile(absoluteFilePath, file.buffer);

  return {
    provider: "local",
    path: relativePath,
    url: buildLocalAssetUrl(req, relativePath),
    publicId: relativePath,
  };
};

const uploadCloudinaryImage = async (file, folderName) => {
  ensureCloudinaryConfigured();

  const extension = getFileExtension(file);
  const baseName = sanitizeBaseName(path.basename(file.originalname || folderName, extension));
  const publicId = `${baseName || folderName}-${Date.now()}`;

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `restaurant/${folderName}`,
        public_id: publicId,
        resource_type: "image",
        overwrite: false,
      },
      (error, response) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(response);
      }
    );

    uploadStream.end(file.buffer);
  });

  return {
    provider: "cloudinary",
    path: result.secure_url,
    url: result.secure_url,
    publicId: result.public_id,
  };
};

const uploadImage = async ({ req, file, folderName }) => {
  if (!file) {
    return null;
  }

  const provider = String(process.env.IMAGE_STORAGE_PROVIDER || "local").toLowerCase();

  if (provider === "cloudinary") {
    return uploadCloudinaryImage(file, folderName);
  }

  return uploadLocalImage(req, file, folderName);
};

module.exports = {
  LOCAL_IMAGE_ROOT,
  ensureCloudinaryConfigured,
  normalizeStoredPath,
  uploadImage,
  uploadCloudinaryImage,
};
