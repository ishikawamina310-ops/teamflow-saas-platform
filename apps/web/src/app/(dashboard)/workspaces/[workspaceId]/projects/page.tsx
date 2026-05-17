import { ProjectsPageContent } from '@/features/projects/components/ProjectsPageContent';

export default function WorkspaceProjectsPage({
  params,
}: {
  params: { workspaceId: string };
}) {
  return <ProjectsPageContent workspaceId={params.workspaceId} />;
}
