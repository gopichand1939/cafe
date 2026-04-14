import { lazy } from "react";
import { Navigate } from "react-router-dom";
import { AddCategory, Category, DeleteCategory, EditCategory, ViewCategory } from "../components/Category";
import { AddItem, DeleteItem, EditItem, Item, ViewItem } from "../components/Items";
import { getFirstAccessibleRoute } from "../Utils/authStorage";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";
import { withSuspense } from "./routeHelpers";

const Login = lazy(() => import("../Pages/Login/Login"));
const Register = lazy(() => import("../Pages/Register/Register"));
const Dashboard = lazy(() => import("../components/Dashboard/Dashboard"));
const RestaurantTimings = lazy(() => import("../components/Restaurant/RestaurantTimings"));
const ModulePlaceholder = lazy(() => import("../components/common/ModulePlaceholder"));
const AppShell = lazy(() => import("../components/common/AppShell"));

const NotFoundRedirect = () => <Navigate to="/login" replace />;

export const authRoutes = [
  {
    path: "login",
    element: withSuspense(<Login />),
  },
  {
    path: "register",
    element: withSuspense(<Register />),
  },
];

export const appRoutes = [
  {
    element: withSuspense(<AppShell />),
    children: [
      {
        path: "/",
        element: <Navigate to={getFirstAccessibleRoute()} replace />,
      },
      {
        index: true,
        element: withSuspense(<Dashboard />),
      },
      {
        path: "dashboard",
        element: withSuspense(<Dashboard />),
      },
      {
        path: "authentication",
        element: withSuspense(<ModulePlaceholder title="Authentication" />),
      },
      {
        path: "settings",
        element: withSuspense(<ModulePlaceholder title="Settings" />),
      },
      {
        path: "orders",
        element: withSuspense(<ModulePlaceholder title="Orders" />),
      },
      {
        path: "customers",
        element: withSuspense(<ModulePlaceholder title="Customers" />),
      },
      {
        path: "reviews",
        element: withSuspense(<ModulePlaceholder title="Reviews" />),
      },
      {
        path: "user-management",
        element: withSuspense(<ModulePlaceholder title="User Management" />),
      },
      {
        path: "timings",
        element: withSuspense(<RestaurantTimings />),
      },
     
     
     
     
     
      {
        path: "category",
        element: withSuspense(<Category />),
      },
      {
        path: "addcategory",
        element: withSuspense(<AddCategory />),
      },
      {
        path: "viewcategory/:id",
        element: withSuspense(<ViewCategory />),
      },
      {
        path: "editcategory/:id",
        element: withSuspense(<EditCategory />),
      },
      {
        path: "deletecategory/:id",
        element: withSuspense(<DeleteCategory />),
      },
      
      
      
      
      
      
      
      {
        path: "items",
        element: withSuspense(<Item />),
      },
      {
        path: "additem",
        element: withSuspense(<AddItem />),
      },
      {
        path: "viewitem/:id",
        element: withSuspense(<ViewItem />),
      },
      {
        path: "edititem/:id",
        element: withSuspense(<EditItem />),
      },
      {
        path: "deleteitem/:id",
        element: withSuspense(<DeleteItem />),
      },
    ],
  },
];





export const allRoutes = [
  {
    element: <PublicOnlyRoute />,
    children: authRoutes,
  },
  {
    element: <ProtectedRoute />,
    children: appRoutes,
  },
  {
    path: "*",
    element: withSuspense(<NotFoundRedirect />),
  },
];
