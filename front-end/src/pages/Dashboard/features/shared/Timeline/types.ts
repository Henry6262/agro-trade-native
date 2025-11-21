export interface TimelineEvent {
  id: string;
  title: string;
  timestamp: string;
  status: 'pending' | 'in_progress' | 'completed';
}
