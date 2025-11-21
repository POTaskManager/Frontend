export type RoleName = 'admin' | 'manager' | 'member';

export interface Role {
  id: string;
  name: RoleName;
  permissions: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  status: 'active' | 'invited' | 'disabled';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: RoleName;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  goal?: string;
}

export interface Task {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  state: 'todo' | 'in_progress' | 'review' | 'done';
  assigneeId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  sprintId?: string;
  tags?: string[];
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'task' | 'comment' | 'system';
  body: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}


