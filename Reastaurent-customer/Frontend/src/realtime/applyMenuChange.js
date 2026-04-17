const CATEGORY_IMAGE_FIELDS = ["category_image"];
const ITEM_IMAGE_FIELDS = ["item_image"];

const isActiveRecord = (record) =>
  Boolean(record) &&
  Number(record.is_deleted ?? 0) === 0 &&
  Number(record.is_active ?? 1) === 1;

const sortCategories = (categories) =>
  [...categories].sort((left, right) => Number(left.id) - Number(right.id));

const sortItems = (items) =>
  [...items].sort((left, right) => Number(right.id) - Number(left.id));

const sortAddons = (addons) =>
  [...addons].sort((left, right) => {
    const leftSortOrder = Number(left.sort_order ?? 0);
    const rightSortOrder = Number(right.sort_order ?? 0);

    if (leftSortOrder !== rightSortOrder) {
      return leftSortOrder - rightSortOrder;
    }

    return Number(right.id) - Number(left.id);
  });

const upsertById = (items, nextItem) => {
  const filteredItems = items.filter((item) => Number(item.id) !== Number(nextItem.id));
  return [...filteredItems, nextItem];
};

const removeById = (items, id) =>
  items.filter((item) => Number(item.id) !== Number(id));

const getImageField = (entity = {}) => {
  if (Object.prototype.hasOwnProperty.call(entity, "category_image")) {
    return CATEGORY_IMAGE_FIELDS[0];
  }

  if (Object.prototype.hasOwnProperty.call(entity, "item_image")) {
    return ITEM_IMAGE_FIELDS[0];
  }

  return null;
};

const normalizeEntityImage = (entity) => {
  if (!entity) {
    return entity;
  }

  const imageField = getImageField(entity);

  if (!imageField) {
    return entity;
  }

  const directUrl = entity[`${imageField}_url`];
  const rawValue = entity[imageField];

  return {
    ...entity,
    [`${imageField}_url`]: directUrl || rawValue || "",
  };
};

export const applyCategoryChange = ({ categories, selectedCategory, change }) => {
  const nextCategory = normalizeEntityImage(change.entityData);
  let nextCategories = categories;
  let nextSelectedCategory = selectedCategory;

  if (change.action === "deleted" || !isActiveRecord(nextCategory)) {
    nextCategories = sortCategories(removeById(categories, change.entityId));
  } else if (nextCategory) {
    nextCategories = sortCategories(upsertById(categories, nextCategory));
  }

  const stillSelected = nextCategories.some(
    (category) => Number(category.id) === Number(nextSelectedCategory)
  );

  if (!stillSelected) {
    nextSelectedCategory = nextCategories[0]?.id ?? null;
  }

  return {
    categories: nextCategories,
    selectedCategory: nextSelectedCategory,
  };
};

export const applyItemChange = ({ items, selectedCategory, selectedItem, change }) => {
  const nextItem = normalizeEntityImage(change.entityData);
  const targetCategoryId = Number(selectedCategory);
  const nextCategoryId = Number(nextItem?.category_id ?? change.categoryId);
  const previousCategoryId = Number(change.previousCategoryId ?? change.categoryId);
  let nextItems = items;
  let nextSelectedItem = selectedItem;

  if (change.action === "deleted" || !isActiveRecord(nextItem)) {
    if (previousCategoryId === targetCategoryId || nextCategoryId === targetCategoryId) {
      nextItems = sortItems(removeById(items, change.entityId));
    }
  } else if (targetCategoryId === nextCategoryId) {
    nextItems = sortItems(upsertById(items, nextItem));
  } else if (targetCategoryId === previousCategoryId) {
    nextItems = sortItems(removeById(items, change.entityId));
  }

  if (selectedItem && Number(selectedItem.id) === Number(change.entityId)) {
    if (change.action === "deleted" || !isActiveRecord(nextItem)) {
      nextSelectedItem = null;
    } else {
      nextSelectedItem = nextItem;
    }
  }

  return {
    items: nextItems,
    selectedItem: nextSelectedItem,
  };
};

const patchAddonList = (addons, change) => {
  const nextAddon = change.entityData;

  if (change.action === "deleted" || !isActiveRecord(nextAddon)) {
    return sortAddons(removeById(addons, change.entityId));
  }

  return sortAddons(upsertById(addons, nextAddon));
};

export const applyAddonChange = ({
  addonCache,
  selectedItem,
  selectedItemAddons,
  change,
}) => {
  const nextAddon = change.entityData;
  const nextAddonCache = { ...addonCache };
  const targetItemId = Number(nextAddon?.item_id ?? change.itemId);
  const previousItemId = Number(change.previousItemId ?? change.itemId);
  let nextSelectedItemAddons = selectedItemAddons;

  if (previousItemId && nextAddonCache[previousItemId]) {
    nextAddonCache[previousItemId] = sortAddons(
      removeById(nextAddonCache[previousItemId], change.entityId)
    );
  }

  if (targetItemId && nextAddonCache[targetItemId]) {
    nextAddonCache[targetItemId] = patchAddonList(nextAddonCache[targetItemId], change);
  }

  if (selectedItem) {
    const selectedItemId = Number(selectedItem.id);

    if (selectedItemId === previousItemId && selectedItemId !== targetItemId) {
      nextSelectedItemAddons = sortAddons(
        removeById(selectedItemAddons, change.entityId)
      );
    } else if (selectedItemId === targetItemId) {
      nextSelectedItemAddons = patchAddonList(selectedItemAddons, change);
    }
  }

  return {
    addonCache: nextAddonCache,
    selectedItemAddons: nextSelectedItemAddons,
  };
};
