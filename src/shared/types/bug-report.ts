export interface BugReport {
  title: string;
  description: string;
  category: 'bug' | 'feature' | 'improvement' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userEmail?: string;
  userAgent: string;
  url: string;
  timestamp: string;
  attachments?: File[];
}
