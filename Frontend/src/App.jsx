// Frontend/src/App.jsx
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Provider } from "react-redux";
import Store from "./Redux/Store";
import appRouter from "./Router/Router";

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
    />
  );
}

function App() {
  return (
    <Provider store={Store}>
      <ToastWithTheme />
      <div className="h-screen overflow-hidden">
        <RouterProvider router={appRouter} />
      </div>
    </Provider>
  );
}

export default App;
