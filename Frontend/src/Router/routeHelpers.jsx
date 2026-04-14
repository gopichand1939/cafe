import { Suspense } from "react";

function RouteLoader() {
  return <div className="grid min-h-[40vh] place-items-center font-semibold text-slate-600">Loading...</div>;
}

export const withSuspense = (element) => (
  <Suspense fallback={<RouteLoader />}>{element}</Suspense>
);
