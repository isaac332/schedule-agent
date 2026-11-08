import { Suspense } from "react";
import { ChatAgentWorkspace } from "@/components/ChatAgentWorkspace";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#fbf7f4]" />}>
      <ChatAgentWorkspace />
    </Suspense>
  );
}
