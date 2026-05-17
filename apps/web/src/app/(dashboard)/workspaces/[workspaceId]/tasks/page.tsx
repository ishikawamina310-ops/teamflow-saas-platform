import { TasksPageContent } from '@/features/tasks/components/TasksPageContent';

export default function WorkspaceTasksPage({
  params,
}: {
  params: { workspaceId: string };
}) {
  return <TasksPageContent workspaceId={params.workspaceId} />;
}
