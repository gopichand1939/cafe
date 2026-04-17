export const getImageUrl = (entity, fieldName) => {
  if (!entity || !fieldName) {
    return "";
  }

  const directUrl = entity[`${fieldName}_url`];
  const rawValue = entity[fieldName];

  if (directUrl) {
    return directUrl;
  }

  if (!rawValue) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(rawValue) || /^(data|blob):/i.test(rawValue)) {
    return rawValue;
  }

  return `/images/${String(rawValue).replace(/^\/+/g, "")}`;
};
