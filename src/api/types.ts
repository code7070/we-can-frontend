export type UserRole = "pm" | "engineer" | "qa" | "designer";

export interface User {
  id: string;
  name: string;
  email?: string;
  role?: UserRole;
  createdAt?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterResponse {
  user: User;
  token: string;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  taskCount: number;
  remainingCount: number;
}

export interface Task {
  id: string;
  title: string;
  isDone: boolean;
  assignees: User[];
  dueDate?: string;
  commentCount?: number;
}

export interface LinkedTask {
  id: string;
  title: string;
  isDone: boolean;
  project: { id: string; name: string; slug: string };
  groupTitle: string;
  relation: "follow-up-of" | "related-to";
}

export interface Comment {
  id: string;
  body: string;
  author: User;
  createdAt: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  url: string;
  mimeType: string;
}

export interface TaskGroup {
  id: string;
  title: string;
  sortOrder: number;
  tasks: Task[];
}

export interface ProjectDetail extends Project {
  groups: TaskGroup[];
  createdAt?: string;
  createdBy?: { name: string } | null;
  updatedAt?: string | null;
  updatedBy?: { name: string } | null;
}

export interface TaskDetail extends Task {
  description?: string;
  branch?: string | null;
  linkedTasks: LinkedTask[];
  thread: Comment[];
  group: { id: string; title: string };
  project: { id: string; name: string; slug: string };
  createdAt?: string;
  createdBy?: { id: string; name: string; role?: string | null } | null;
  updatedAt?: string;
  updatedBy?: { id: string; name: string; role?: string | null } | null;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  groups: string[];
  memberIds?: string[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  groups?: string[];
  memberIds?: string[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  groupId: string;
  assigneeIds?: string[];
  dueDate?: string;
  linkedTaskIds?: string[];
}

export interface ApiToken {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface CreatedApiToken extends ApiToken {
  token: string; // raw token, only returned once
}

export interface SearchResults {
  projects: Project[];
  tasks: (Task & { project: { name: string; slug: string } })[];
  comments: (Comment & { task: { id: string; title: string; project: { name: string; slug: string } } })[];
}
