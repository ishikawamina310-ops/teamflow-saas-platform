import { ProjectsPageContent } from '@/features/projects/components/ProjectsPageContent';

export default async function WorkspaceProjectsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return (
    <ProjectsPageContent
      workspaceId={workspaceId}
    />
  );
}
