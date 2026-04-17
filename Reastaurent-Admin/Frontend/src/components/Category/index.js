import { lazy } from "react";

export const Category = lazy(() => import("./Category"));
export const AddCategory = lazy(() => import("./AddCategory"));
export const EditCategory = lazy(() => import("./EditCategory"));
export const DeleteCategory = lazy(() => import("./DeleteCategory"));
export const ViewCategory = lazy(() => import("./ViewCategory"));
