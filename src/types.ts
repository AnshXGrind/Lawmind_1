export interface User {
  id: number;
  email: string;
  name: string;
}

export interface Draft {
  id: number;
  user_id: number;
  title: string;
  content: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface LegalEvent {
  id: number;
  user_id: number;
  title: string;
  description: string;
  event_date: string;
  type: string;
  created_at: string;
}

export type DraftType = 'Petition' | 'Contract' | 'Bail Application' | 'Affidavit' | 'Legal Notice';
