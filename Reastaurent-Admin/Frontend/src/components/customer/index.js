import { lazy } from "react";

export const Customer = lazy(() => import("./Customer"));
export const AddCustomer = lazy(() => import("./AddCustomer"));
export const EditCustomer = lazy(() => import("./EditCustomer"));
export const DeleteCustomer = lazy(() => import("./DeleteCustomer"));
export const ViewCustomer = lazy(() => import("./ViewCustomer"));
