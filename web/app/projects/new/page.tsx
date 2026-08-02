import type { Metadata } from "next";
import NewProjectFlow from "@/components/new-project-flow";

export const metadata: Metadata = {
  title: "Start a project · Bankole",
  description:
    "Set the scope, choose a verified agent, and fund a milestone plan held in escrow.",
};

export default function NewProjectPage() {
  return <NewProjectFlow />;
}
