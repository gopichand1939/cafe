# Restaurant Image Flow and Cloudinary Migration

This project has two image storage modes in the admin backend:

- `local`: images are saved inside `Reastaurent-Admin/Backend/images`
- `cloudinary`: images are uploaded directly to Cloudinary

This document explains how the image flow works, how old local images were moved to Cloudinary, which commands are used, and what structure we followed.

## Main folders we followed

```text
Reastaurent/
├─ Reastaurent-Admin/
│  ├─ Backend/
│  │  ├─ category/
│  │  │  ├─ CategoryController.js
│  │  │  ├─ categoryRoutes.js
│  │  │  └─ uploadMiddleware.js
│  │  ├─ items/
│  │  │  ├─ ItemController.js
│  │  │  ├─ itemRoutes.js
│  │  │  └─ uploadMiddleware.js
│  │  ├─ images/
│  │  │  ├─ category-images/
│  │  │  └─ item-images/
│  │  ├─ scripts/
│  │  │  └─ migrateImagesToCloudinary.js
│  │  ├─ utils/
│  │  │  ├─ media.js
│  │  │  └─ storageService.js
│  │  ├─ server.js
│  │  └─ package.json
│  └─ Frontend/
└─ Reastaurent-customer/
```

## How image upload works now

### 1. Request comes from category or item API

Routes use `multer` middleware:

- `Reastaurent-Admin/Backend/category/categoryRoutes.js`
- `Reastaurent-Admin/Backend/items/itemRoutes.js`

Middleware files:

- `Reastaurent-Admin/Backend/category/uploadMiddleware.js`
- `Reastaurent-Admin/Backend/items/uploadMiddleware.js`

What this middleware does:

- accepts only image files
- stores the uploaded file in memory with `multer.memoryStorage()`
- limits size to `5MB`

So the file is not written directly by `multer`. It is passed as `req.file` to the controller.

### 2. Controller sends the file to the shared storage layer

Used in:

- `CategoryController.js`
- `ItemController.js`

Both call:

```js
uploadImage({ req, file: req.file, folderName: "category-images" })
uploadImage({ req, file: req.file, folderName: "item-images" })
```

This logic is centralized in:

- `Reastaurent-Admin/Backend/utils/storageService.js`

### 3. `storageService.js` decides where the image goes

This file checks:

```env
IMAGE_STORAGE_PROVIDER=local
```

or

```env
IMAGE_STORAGE_PROVIDER=cloudinary
```

Behavior:

- if provider is `local`, image is saved in `Backend/images/...`
- if provider is `cloudinary`, image is uploaded to Cloudinary

## Local image flow

When `IMAGE_STORAGE_PROVIDER=local`:

1. file name is sanitized
2. timestamp is added
3. file is written into:
   - `images/category-images/`
   - `images/item-images/`
4. database stores a relative path like:

```text
category-images/example-1710000000000.jpg
```

5. backend serves it from:

```text
/images/<stored-path>
```

Example final URL:

```text
http://localhost:5000/images/category-images/example-1710000000000.jpg
```

This static serving is configured in:

- `Reastaurent-Admin/Backend/server.js`

## Cloudinary image flow

When `IMAGE_STORAGE_PROVIDER=cloudinary`:

1. backend configures Cloudinary
2. file buffer is streamed to Cloudinary
3. image is uploaded into folder:

```text
restaurant/category-images
restaurant/item-images
```

4. database stores the Cloudinary secure URL directly

Example stored value:

```text
https://res.cloudinary.com/your-cloud/image/upload/v.../restaurant/item-images/file-name.jpg
```

This means the frontend can use the URL directly without needing local `/images/...` routing.

## How old images were moved to Cloudinary

Old records were already stored locally in:

- `Reastaurent-Admin/Backend/images/category-images`
- `Reastaurent-Admin/Backend/images/item-images`

To move them, this script is used:

- `Reastaurent-Admin/Backend/scripts/migrateImagesToCloudinary.js`

### What the migration script does

It performs this flow:

1. loads environment variables with `dotenv`
2. connects to the database
3. selects records from:
   - `category`
   - `items`
4. only picks rows where image field:
   - is not null
   - is not empty
   - is not already an `http` URL
5. builds absolute file path from the stored local path
6. reads the file from disk
7. uploads the file to Cloudinary
8. updates the database row with the new Cloudinary URL
9. prints progress in the console

### Tables and fields covered

- `category.category_image`
- `items.item_image`

So this migration handles category images and item images.

## Commands we use

Run these commands from:

```text
Reastaurent-Admin/Backend
```

### Install packages

```powershell
npm install
```

### Start backend normally

```powershell
npm start
```

This runs:

```powershell
node server.js
```

### Run Cloudinary migration

```powershell
npm run migrate:cloudinary
```

This runs:

```powershell
node scripts/migrateImagesToCloudinary.js
```

## Environment variables needed

You can configure Cloudinary in either of these ways.

### Option 1: single URL

```env
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
IMAGE_STORAGE_PROVIDER=cloudinary
```

### Option 2: separate keys

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
IMAGE_STORAGE_PROVIDER=cloudinary
```

Optional for local URL generation:

```env
PUBLIC_ASSET_BASE_URL=http://localhost:5000
```

## Command explanation

### `npm install`

Installs backend dependencies from `package.json`, including:

- `cloudinary`
- `multer`
- `dotenv`
- `express`
- `pg`

### `npm start`

Starts the backend server. If local image mode is active, the server also exposes:

```text
/images
```

as a static public route.

### `npm run migrate:cloudinary`

Runs the one-time migration script that moves old local files to Cloudinary and updates database image fields.

## Structure we followed

We followed this structure so image handling stays clean:

### 1. Upload validation is separated

`uploadMiddleware.js` is only responsible for:

- file type check
- size limit
- making `req.file` available

### 2. Storage logic is centralized

`utils/storageService.js` is the single shared place for:

- local file save
- Cloudinary upload
- provider switching

This avoids duplicate upload logic in controllers.

### 3. Controllers stay small

Controllers only:

- validate request body
- call `uploadImage(...)`
- store returned path in DB
- send API response

### 4. URL building is separated

`utils/media.js` prepares response URLs for frontend use.

It detects whether an image is:

- local
- cloudinary
- another remote URL

### 5. Migration is isolated in a script

Instead of mixing migration code into controllers or server startup, the project uses:

```text
scripts/migrateImagesToCloudinary.js
```

That keeps the migration safe, repeatable, and easy to run manually.

## Simple end-to-end flow

### For new uploads

1. admin uploads image
2. `multer` reads it into memory
3. controller calls `uploadImage`
4. storage service sends it to local disk or Cloudinary
5. returned path/URL is saved in DB
6. API response includes usable image URL

### For old local images

1. migration script reads old DB records
2. script loads file from `Backend/images`
3. script uploads file to Cloudinary
4. script updates DB with Cloudinary URL
5. future API responses use the Cloudinary image

## Important note

The migration script updates database records, but it does not delete old local files after upload. That means local files can still remain in:

- `Backend/images/category-images`
- `Backend/images/item-images`

If you want, those can be cleaned later after verifying all migrated URLs are working.
