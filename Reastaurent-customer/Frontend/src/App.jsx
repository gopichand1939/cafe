import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Lazy load pages
const Home = lazy(() => import("./Pages/Home/Home"));
const Office = lazy(() => import("./Pages/Office/Office"));

const PageLoader = () => (
  <div style={{ 
    display: "flex", 
    justifyContent: "center", 
    alignItems: "center", 
    height: "100vh",
    fontSize: "1.2rem",
    fontWeight: "600",
    color: "#666"
  }}>
    Loading page...
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/office" element={<Office />} />
          {/* Add more routes here as needed */}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
