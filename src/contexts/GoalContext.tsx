export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'personal' | 'health' | 'relationships' | 'financial' | 'spiritual';
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  progress: number;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
  isCompleted?: boolean;
}