
export interface Article {
  id: number;
  article_number: string;
  name?: string;
  created_at: string;
  // Optional category; existing rows without this will be treated as 'shirts'
  category?: 'shirts' | 'jeans' | 'trousers';
}

export interface Color {
  id: number;
  article_id: number;
  image_url: string;
  storage_path: string;
  created_at: string;
}
