require("dotenv").config();

const fs = require("fs");
const path = require("path");
const db = require("../config/db");
const {
  LOCAL_IMAGE_ROOT,
  ensureCloudinaryConfigured,
  normalizeStoredPath,
  uploadCloudinaryImage,
} = require("../utils/storageService");

const categoryQuery = `
  SELECT id, category_image
  FROM category
  WHERE category_image IS NOT NULL
    AND category_image != ''
    AND category_image NOT LIKE 'http%'
`;

const itemQuery = `
  SELECT id, item_image
  FROM items
  WHERE item_image IS NOT NULL
    AND item_image != ''
    AND item_image NOT LIKE 'http%'
`;

const getAbsoluteImagePath = (storedPath) =>
  path.join(LOCAL_IMAGE_ROOT, normalizeStoredPath(storedPath));

const createFileLikeObject = async (absolutePath, storedPath) => ({
  originalname: path.basename(storedPath),
  buffer: await fs.promises.readFile(absolutePath),
});

const migrateRecords = async ({
  selectQuery,
  idField,
  imageField,
  updateTable,
  folderName,
}) => {
  const result = await db.query(selectQuery);
  let migratedCount = 0;

  for (const row of result.rows) {
    const storedPath = row[imageField];
    const absolutePath = getAbsoluteImagePath(storedPath);

    if (!fs.existsSync(absolutePath)) {
      console.warn(`Skipping ${updateTable} ${row[idField]}: file not found at ${absolutePath}`);
      continue;
    }

    const uploadedImage = await uploadCloudinaryImage(
      await createFileLikeObject(absolutePath, storedPath),
      folderName
    );

    await db.query(
      `UPDATE ${updateTable} SET ${imageField} = $1, updated_at = CURRENT_TIMESTAMP WHERE ${idField} = $2`,
      [uploadedImage.path, row[idField]]
    );

    migratedCount += 1;
    console.log(`Migrated ${updateTable} ${row[idField]} -> ${uploadedImage.path}`);
  }

  return migratedCount;
};

const run = async () => {
  try {
    ensureCloudinaryConfigured();

    const categoryCount = await migrateRecords({
      selectQuery: categoryQuery,
      idField: "id",
      imageField: "category_image",
      updateTable: "category",
      folderName: "category-images",
    });

    const itemCount = await migrateRecords({
      selectQuery: itemQuery,
      idField: "id",
      imageField: "item_image",
      updateTable: "items",
      folderName: "item-images",
    });

    console.log(`Migration complete. Categories: ${categoryCount}, Items: ${itemCount}`);
    process.exit(0);
  } catch (error) {
    console.error("Cloudinary migration failed:", error);
    process.exit(1);
  } finally {
    await db.pool.end();
  }
};

run();
