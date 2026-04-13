import { lazy } from "react";

export const Item = lazy(() => import("./Item"));
export const AddItem = lazy(() => import("./AddItem"));
export const EditItem = lazy(() => import("./EditItem"));
export const DeleteItem = lazy(() => import("./DeleteItem"));
export const ViewItem = lazy(() => import("./ViewItem"));
