export interface Material {
  id: string;
  name: string;
  content: string;
  createdAt: number;
}

export interface SubTask {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: number;
  subtasks: SubTask[];
}

export interface Task {
  id: string;
  title: string;
  materialIds: string[];
  subtasks: SubTask[];
  createdAt: number;
  status: 'active' | 'completed';
}

export interface Store {
  apiKey: string;
  materials: Material[];
  tasks: Task[];
  reminderEnabled: boolean;
  reminderTime: string;
}

export type View =
  | 'setup'
  | 'dashboard'
  | 'materials'
  | 'new-task'
  | 'focus'
  | 'settings';
