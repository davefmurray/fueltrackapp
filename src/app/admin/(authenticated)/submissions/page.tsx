import { Suspense } from "react";
import { SubmissionsContent } from "./submissions-content";

export default function SubmissionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SubmissionsContent />
    </Suspense>
  );
}
