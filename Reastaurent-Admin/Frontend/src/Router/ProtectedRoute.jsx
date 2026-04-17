import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "../Utils/authStorage";

function ProtectedRoute() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
