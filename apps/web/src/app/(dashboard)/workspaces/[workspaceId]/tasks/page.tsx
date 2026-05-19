import { TasksPageContent } from '@/features/tasks/components/TasksPageContent';

export default async function WorkspaceTasksPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <TasksPageContent workspaceId={workspaceId} />;
}
