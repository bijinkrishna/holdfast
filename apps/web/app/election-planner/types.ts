export type TaskStatus = 'not-started' | 'in-progress' | 'completed' | 'delayed' | 'on-hold';
export type ViewMode = 'gantt' | 'list' | 'dashboard';
export type TimeScale = 'week' | 'month';

export interface Team {
  id: string;
  name: string;
  color: string;
  lead: string;
  description: string;
}

export interface Task {
  id: string;
  teamId: string;
  name: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: TaskStatus;
  progress: number;  // 0–100
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[]; // task IDs
}

export interface ElectionPlan {
  title: string;
  electionDate: string;
  district: string;
  state: string;
  teams: Team[];
  tasks: Task[];
}
