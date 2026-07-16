import axios from 'axios';

const api = axios.create({
  baseURL: '',
  timeout: 30000,
});

export interface FrameEvent {
  stage: string;
  time?: string;
  duration: number;
  cpu?: string;
  memory?: string;
}

export interface Frame {
  frameId: string;
  cameraId: string;
  pipeline: string;
  aiService: string;
  workflow: string;
  workerId: string;
  confidence: number;
  status: 'Completed' | 'Skipped' | 'Failed' | 'Processing';
  detection: string;
  receivedAt: string;
  completedAt?: string;
  totalTime: number;
  error?: string;
  events?: FrameEvent[];
}

export interface KPIStats {
  receivedToday: number;
  completed: number;
  skipped: number;
  failed: number;
  avgProcessTime: number;
  avgAiTime: number;
  activeWorkers: number;
  queueLength: number;
}

export interface LatencyBreakdown {
  avg_weir: number;
  avg_screener: number;
  avg_decision: number;
  avg_duration: number;
}

export interface DashboardData {
  stats: KPIStats;
  latencies: LatencyBreakdown;
  failures: any[];
  journeys: any[];
  throughput: any[];
  cameras: any[];
  workers: any[];
  models: any[];
  workflows: any[];
  queueTimeline?: any[];
  aiTrend?: any[];
  confidenceTrend?: any[];
}

export const getDashboardSummary = async (): Promise<DashboardData> => {
  const res = await api.get('/api/dashboard-summary');
  return res.data;
};

export const getFrameDetails = async (id: string): Promise<Frame> => {
  const res = await api.get(`/api/frame/${id}`);
  return res.data;
};

export const getRecentFrames = async (): Promise<Frame[]> => {
  const res = await api.get('/api/frames');
  return res.data;
};

export const getCameraAnalytics = async (cameraId: string) => {
  const res = await api.get(`/api/camera/${cameraId}`);
  return res.data;
};

export const getWorkerAnalytics = async () => {
  const res = await api.get('/api/workers');
  return res.data;
};

export interface LogLine {
  id: string;
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'ERROR';
  layer: string;
  message: string;
}

export const getPipelineLogs = async (days?: number, limit?: number): Promise<LogLine[]> => {
  const params: Record<string, any> = {};
  if (days !== undefined && days !== null) params.days = days;
  if (limit !== undefined && limit !== null) params.limit = limit;
  const res = await api.get('/api/pipeline-logs', { params });
  return res.data;
};

export interface TelemetrySettings {
  logLevel: string;
  retention: string;
  alerts: boolean;
}

export const getTelemetrySettings = async (): Promise<TelemetrySettings> => {
  const res = await api.get('/api/settings');
  return res.data.settings;
};

export const saveTelemetrySettings = async (settings: TelemetrySettings): Promise<TelemetrySettings> => {
  const res = await api.post('/api/settings', settings);
  return res.data.settings;
};

export const getDeepAnalysis = async () => {
  const res = await api.get('/api/deep-analysis');
  return res.data;
};
