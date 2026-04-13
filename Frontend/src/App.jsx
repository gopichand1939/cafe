import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Provider } from "react-redux";
import Store from "./Redux/Store";
import AppShell from "./components/common/AppShell";
import {
  AddCategory,
  Category,
  DeleteCategory,
  EditCategory,
  ViewCategory,
} from "./components/Category";
import {
  AddItem,
  DeleteItem,
  EditItem,
  Item,
  ViewItem,
} from "./components/Items";
import Login from "./Pages/Login/Login";
import Register from "./Pages/Register/Register";
import { getAccessToken } from "./Utils/authStorage";
import "./App.css";

if (typeof window !== "undefined") {
  import("react-toastify/dist/ReactToastify.css");
}

function ToastWithTheme() {
  return (
    <ToastContainer
      theme="light"
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      toastClassName="toast-roboto-condensed"
    />
  );
}

function ProtectedRoutes() {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function PublicOnlyRoute() {
  const accessToken = getAccessToken();

  if (accessToken) {
    return <Navigate to="/category" replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <Provider store={Store}>
      <ToastWithTheme />
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route element={<ProtectedRoutes />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Navigate to="/category" replace />} />
                <Route path="/category" element={<Category />} />
                <Route path="/addcategory" element={<AddCategory />} />
                <Route path="/viewcategory/:id" element={<ViewCategory />} />
                <Route path="/editcategory/:id" element={<EditCategory />} />
                <Route path="/deletecategory/:id" element={<DeleteCategory />} />
                <Route path="/items" element={<Item />} />
                <Route path="/additem" element={<AddItem />} />
                <Route path="/viewitem/:id" element={<ViewItem />} />
                <Route path="/edititem/:id" element={<EditItem />} />
                <Route path="/deleteitem/:id" element={<DeleteItem />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </Provider>
  );
}

export default App;
