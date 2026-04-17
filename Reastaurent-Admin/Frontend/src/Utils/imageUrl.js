import { BACKEND_BASE_URL } from "./Constant";

const trimLeadingSlash = (value = "") => String(value || "").replace(/^\/+/g, "");

export const resolveImageUrl = (source, baseUrl = BACKEND_BASE_URL) => {
  if (!source) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(source) || /^(data|blob):/i.test(source)) {
    return source;
  }

  return `${String(baseUrl || "").replace(/\/+$/g, "")}/images/${trimLeadingSlash(
    String(source).replace(/\\/g, "/")
  )}`;
};

export const getImageUrl = (entity, fieldName, baseUrl = BACKEND_BASE_URL) => {
  if (!entity || !fieldName) {
    return "";
  }

  const directUrl = entity[`${fieldName}_url`] || entity[`${fieldName}_media`]?.url;

  return resolveImageUrl(directUrl || entity[fieldName], baseUrl);
};
