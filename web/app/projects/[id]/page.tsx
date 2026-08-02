import { notFound } from "next/navigation";
import {
  agents,
  getActivityForProject,
  getDocumentsForProject,
  getMilestonesForProject,
  getProject,
  getProofsForProject,
} from "@/lib/mock-data";
import ProjectWorkspace from "@/components/project-workspace";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const agent = agents.find((a) => a.id === project.agentId);
  if (!agent) notFound();

  return (
    <ProjectWorkspace
      project={project}
      agent={agent}
      initialMilestones={getMilestonesForProject(project.id)}
      initialProofs={getProofsForProject(project.id)}
      initialActivity={getActivityForProject(project.id)}
      documents={getDocumentsForProject(project.id)}
    />
  );
}
