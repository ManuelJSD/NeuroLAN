export interface LmStudioModelsResponse {
  models: LmStudioModel[];
}

export type LmStudioModelType = 'llm' | 'embedding';

export interface LmStudioModel {
  key: string;
  display_name: string;
  type: LmStudioModelType;
  params_string?: string | null;
  size_bytes?: number;
  description?: string | null;
}
