import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Provider } from "react-redux";
import Store from "./Redux/Store";
import AppShell from "./components/common/AppShell";
import Loader from "./components/common/Loader";
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

function App() {
  return (
    <Provider store={Store}>
      <ToastWithTheme />
      <div className="App">
        <BrowserRouter>
          <Routes>
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
              <Route path="*" element={<Navigate to="/category" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </div>
    </Provider>
  );
}

export default App;
