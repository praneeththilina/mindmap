export interface Map {
  id: string;
  title: string;
  description: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  node_count?: number;
  mastery_percentage?: number;
}

export interface Node {
  id: string;
  map_id: string;
  parent_id: string | null;
  title: string;
  notes: string;
  color: string;
  x: number;
  y: number;
  shape: 'rounded' | 'circle' | 'sticky';
  mastery_level: number;
  is_important: boolean;
  is_starred: boolean;
  fontSize?: number;
  textColor?: string;
  isBold?: boolean;
  isItalic?: boolean;
  group_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  user_id: string;
  name?: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  last_active: string;
}
