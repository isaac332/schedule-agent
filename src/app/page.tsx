import { Suspense } from "react";
import { ScheduleAgentWorkspace } from "@/components/ScheduleAgentWorkspace";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#fbf7f4]" />}>
      <ScheduleAgentWorkspace />
    </Suspense>
  );
}
