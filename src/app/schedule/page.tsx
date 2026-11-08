import { Suspense } from "react";
import { SimpleScheduleWorkspace } from "@/components/SimpleScheduleWorkspace";

export default function SchedulePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#fbf7f4]" />}>
      <SimpleScheduleWorkspace />
    </Suspense>
  );
}
