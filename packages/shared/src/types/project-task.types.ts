export interface ProjectSummary {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  color: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSummary {
  id: string;
  workspaceId: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string | null;
  status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  position: number;
  labels: string[];
  dueDate: string | null;
  authorId: string;
  assigneeId: string | null;
  assignee: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
