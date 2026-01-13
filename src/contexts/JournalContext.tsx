export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: 'great' | 'good' | 'neutral' | 'low' | 'struggling';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isFavorite?: boolean;
}