export interface BuildRequest {
  projectId: string;
  platform: 'ios' | 'android';
  version: number;
  profile: 'development' | 'preview' | 'production';
}

export interface BuildStatus {
  id: string;
  projectId: string;
  platform: string;
  status: 'queued' | 'building' | 'success' | 'failed';
  easBuildId?: string;
  artifactUrl?: string;
  logs?: string;
  errorSummary?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface EASBuildResponse {
  id: string;
  status: string;
  platform: string;
  artifacts?: {
    buildUrl: string;
  };
}
