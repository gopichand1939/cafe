import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken, getFirstAccessibleRoute } from "../Utils/authStorage";

function PublicOnlyRoute() {
  const accessToken = getAccessToken();

  if (accessToken) {
    return <Navigate to={getFirstAccessibleRoute()} replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
