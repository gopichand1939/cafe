# Customer Image UI Flow

This document explains how images are handled in the customer portal UI.

It covers:

- where image data comes from
- whether images come from API directly or separately
- how images are rendered on screen
- what happens while scrolling
- why images appear as separate requests in browser Network tab

## Simple answer

Images are handled in two parts:

1. the API sends image path or image URL in JSON
2. the browser fetches the actual image file separately through `<img src="...">`

So:

- API does not send the full image binary inside the JSON response 
- API sends image reference only
- browser then downloads the actual image as a separate image request

That is why in Network tab you see:

- `items-by-category` as `fetch`
- image files as `jpeg` or `png`

## Full flow

```text
Customer frontend calls API
  -> API returns item/category data with image fields
  -> frontend builds final image URL
  -> React renders <img src="...">
  -> browser fetches image separately
  -> image appears on screen
```

## Backend side: where image URL is prepared

Files:

- `Reastaurent-customer/Backend/AllGetControler.js`
- `Reastaurent-customer/Backend/media.js`

### Categories API

When customer frontend requests categories:

```text
POST /api/categories
```

backend queries category data and adds:

```text
category_image_url
```

This happens through:

```js
attachImageUrl(req, row, "category_image")
```

### Items API

When customer frontend requests items:

```text
POST /api/items-by-category
```

backend queries items and adds:

```text
item_image_url
```

This also happens through:

```js
attachImageUrl(req, row, "item_image")
```

## How backend decides image URL

File:

- `Reastaurent-customer/Backend/media.js`

Backend logic:

### If stored image is already a full URL

Example:

```text
https://res.cloudinary.com/...
```

Then backend returns it directly.

### If stored image is a local relative path

Example:

```text
item-images/file.jpg
```

Then backend builds:

```text
/images/item-images/file.jpg
```

or:

```text
http://host/images/item-images/file.jpg
```

depending on config.

So backend always tries to give frontend a usable image URL.

## Frontend side: how image URL is used

File:

- `Reastaurent-customer/Frontend/src/Utils/imageUrl.js`

Frontend helper:

```js
getImageUrl(entity, fieldName)
```

This function checks:

1. `${fieldName}_url`
2. raw image field
3. local `/images/...` fallback

### Example

For category:

```js
getImageUrl(cat, "category_image")
```

For item:

```js
getImageUrl(item, "item_image")
```

So the UI does not manually build complicated URLs each time. It uses one reusable helper.

## Where images are rendered

### Category images

File:

- `Reastaurent-customer/Frontend/src/components/CategoryBar.jsx`

Images are rendered like this:

```jsx
<img
  src={getImageUrl(cat, "category_image")}
  alt={cat.category_name}
  loading="lazy"
  decoding="async"
/>
```

### Item images

File:

- `Reastaurent-customer/Frontend/src/components/ItemGrid.jsx`

Images are rendered like this:

```jsx
<img
  src={getImageUrl(item, "item_image")}
  alt={item.item_name}
  loading="lazy"
  decoding="async"
/>
```

That means the browser itself is responsible for downloading and decoding the image.

## What `loading="lazy"` means

Both category and item images use:

```html
loading="lazy"
```

This tells the browser:

- do not download every image immediately at once
- delay some image requests until image is near the visible viewport

So while scrolling:

- visible images load first
- below-screen images may load later
- browser decides the exact timing

This improves performance.

## What `decoding="async"` means

Images also use:

```html
decoding="async"
```

This helps browser decode image data asynchronously, reducing UI blocking.

It does not change where image comes from.

It only helps rendering performance.

## What happens when page first loads

### Step 1

Customer frontend calls:

```text
/api/categories
```

### Step 2

Backend returns category JSON with image URL references.

### Step 3

React renders category `<img>` tags.

### Step 4

Browser fetches those image URLs separately.

So the category API and category image download are separate requests.

## What happens when category changes

When user selects a category:

1. frontend calls:

```text
/api/items-by-category
```

2. backend returns item JSON with `item_image` / `item_image_url`
3. React renders item cards
4. browser fetches item image files separately

That is why in Network tab you see:

- one API request
- then multiple image requests

## What happens while scrolling

This is important.

### Horizontal category scroll

The category bar is scrollable horizontally in UI, but this scroll itself does not call a new categories API.

Images are already in the DOM from the category list response.

The browser may still load some lazy images when they come near view during horizontal scrolling.

### Vertical item scroll

Item grid is rendered from the current selected category data.

When you scroll down:

- browser may trigger lazy image loading for items that were not loaded yet
- this is image file fetching, not another `items-by-category` API call

So scrolling can cause:

- more image requests

but should not automatically cause:

- another menu API request

unless some other app logic triggers it.

## Why images show separately in Network tab

In browser Network tab, you may see:

- `items-by-category` as `fetch`
- image file names as `jpeg`

This is correct.

Reason:

- `fetch` request gets JSON metadata
- `img` request gets actual image bytes

So image loading is split intentionally.

## Are images coming from API response directly?

Not as binary file data.

What comes from API:

- item/category fields
- image path
- image URL

What comes separately:

- actual JPEG/PNG/WebP file bytes

So the answer is:

```text
API gives image reference
browser gives actual image fetch
```

## Cloudinary vs local images

The UI supports both.

### If image is Cloudinary

`src` becomes a full Cloudinary URL like:

```text
https://res.cloudinary.com/...
```

Browser fetches image directly from Cloudinary.

### If image is local

`src` becomes:

```text
/images/...
```

Browser fetches image from backend static route.

Frontend code handles both using the same helper.

## Realtime behavior with images

After the WebSocket improvement:

- if item/category image changes in admin
- realtime event updates customer state
- updated image URL/path is patched into frontend state
- React rerenders changed card/category
- browser fetches the new image URL if needed

So image bytes are still fetched separately by browser, even in realtime flow.

## Why some images show `disk cache`

In Network tab, some image requests may show:

```text
(disk cache)
```

That means browser already has the image cached locally.

So browser may:

- not fully redownload the image
- use cached copy

This is normal and improves performance.

## Current UI image strategy summary

We are handling images in this clean way:

### 1. Backend returns image references

Not raw image file data.

### 2. Frontend uses one helper

`getImageUrl(...)`

### 3. Components render normal `<img>` tags

For category and item cards.

### 4. Browser fetches actual image files

Separately from JSON API calls.

### 5. Lazy loading is enabled

Using:

- `loading="lazy"`
- `decoding="async"`

### 6. Realtime only patches metadata/state

Browser still handles actual image download.

## Files involved

### Backend

- `Reastaurent-customer/Backend/AllGetControler.js`
- `Reastaurent-customer/Backend/media.js`

### Frontend

- `Reastaurent-customer/Frontend/src/Utils/imageUrl.js`
- `Reastaurent-customer/Frontend/src/components/CategoryBar.jsx`
- `Reastaurent-customer/Frontend/src/components/ItemGrid.jsx`

## Final short answer

Customer portal images are handled like this:

1. API returns image URL/path in JSON
2. frontend reads that URL using `getImageUrl`
3. React renders `<img src="...">`
4. browser fetches image separately
5. lazy loading controls when image loads near the viewport

So images are not embedded inside the API response body itself. The API gives the image reference, and the browser fetches the actual image file separately.
