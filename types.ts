
export interface Article {
  id: number;
  article_number: string;
  name?: string;
  created_at: string;
}

export interface Color {
  id: number;
  article_id: number;
  image_url: string;
  storage_path: string;
  created_at: string;
}
