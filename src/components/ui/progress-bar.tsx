import { Suspense } from "react";
import { NavigationProgress } from "./navigation-progress";

export function ProgressBar() {
  return (
    <Suspense fallback={null}>
      <NavigationProgress />
    </Suspense>
  );
}
