export interface Memory {
  id: string;
  content: string;
  /** 'auto' = extracted by the model; 'user' = added/edited manually */
  source: 'auto' | 'user';
  createdAt: number;
  updatedAt: number;
}
