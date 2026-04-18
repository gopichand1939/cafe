import { lazy } from "react";

export const Order = lazy(() => import("./Order"));
export const AddOrder = lazy(() => import("./AddOrder"));
export const EditOrder = lazy(() => import("./EditOrder"));
export const DeleteOrder = lazy(() => import("./DeleteOrder"));
export const ViewOrder = lazy(() => import("./ViewOrder"));
