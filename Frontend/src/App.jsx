// Frontend/src/App.jsx
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Provider } from "react-redux";
import Store from "./Redux/Store";
import appRouter from "./Router/Router";
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
        <RouterProvider router={appRouter} />
      </div>
    </Provider>
  );
}

export default App;
