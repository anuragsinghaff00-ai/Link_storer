export interface User {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface Resource {
  id: string;
  url: string;
  title: string;
  summary?: string;
  website?: string;
  website_icon?: string;
  purpose?: string;
  category?: string;
  date_added: string;
  last_opened?: string;
  open_count: number;
  favorite: boolean;
  pinned: boolean;
  archived: boolean;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
}

export interface Image {
  id: string;
  storage_path: string;
  thumbnail_path?: string;
  title?: string;
  description?: string;
  purpose?: string;
  category?: string;
  date_added: string;
  favorite: boolean;
  pinned: boolean;
  archived: boolean;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  file_type: string;
  file_size: number;
  width: number;
  height: number;
  ocr_text?: string;
  ai_description?: string;
}

export interface Tag {
  id: string;
  name: string;
}
