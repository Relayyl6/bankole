"use client";

import { useSearchParams } from "next/navigation";
import NewProjectFlow from "@/components/new-project-flow";

export default function NewProjectPage() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agentId");
  return <NewProjectFlow initialAgentId={agentId} />;
}
