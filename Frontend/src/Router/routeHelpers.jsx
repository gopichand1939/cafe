import { Suspense } from "react";

function RouteLoader() {
  return (
    <div
      style={{
        minHeight: "40vh",
        display: "grid",
        placeItems: "center",
        color: "#475569",
        fontWeight: 600,
      }}
    >
      Loading...
    </div>
  );
}

export const withSuspense = (element) => (
  <Suspense fallback={<RouteLoader />}>{element}</Suspense>
);
