import { notFound } from "next/navigation";
import {
  agents,
  getActivityForProject,
  getDocumentsForProject,
  getMilestonesForProject,
  getProject,
  getProofsForProject,
} from "@/lib/mock-data";
import { isDraftId } from "@/lib/draft-projects";
import ProjectWorkspace from "@/components/project-workspace";
import DraftProjectPage from "@/components/draft-project-page";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Projects created through the guided flow live in the visitor's browser,
  // so they can only be read on the client.
  if (isDraftId(id)) return <DraftProjectPage id={id} />;

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
