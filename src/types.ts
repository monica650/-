export interface Material {
  id: string;
  name: string;
  content: string;
  createdAt: number;
}

export interface DailyTask {
  id: string;
  title: string;
  estimatedMinutes: number;
  completed: boolean;
  isBonus: boolean;
}

export interface Day {
  dayNum: number;
  phase: string;
  minTasks: DailyTask[];
  bonusTasks: DailyTask[];
}

export interface Phase {
  title: string;
  startDay: number;
  endDay: number;
  description: string;
}

export interface Project {
  id: string;
  title: string;
  totalDays: number;
  startDate: string;
  phases: Phase[];
  days: Day[];
  materialIds: string[];
  createdAt: number;
  status: 'active' | 'completed';
}

export interface Store {
  apiKey: string;
  materials: Material[];
  projects: Project[];
  reminderEnabled: boolean;
  reminderTime: string;
}

export type View =
  | 'setup'
  | 'dashboard'
  | 'materials'
  | 'new-project'
  | 'project'
  | 'today'
  | 'settings';
