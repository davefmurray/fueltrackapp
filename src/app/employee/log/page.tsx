import { Suspense } from "react";
import { LogPageContent } from "./log-page-content";

export default function LogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60dvh]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LogPageContent />
    </Suspense>
  );
}
