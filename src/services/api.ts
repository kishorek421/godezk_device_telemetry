import axios from 'axios';

const api = axios.create({
  baseURL: '',
});

export interface BenchmarkBucket {
  time_bucket: string;
  executions: number;
}

export interface BenchmarkSummary {
  executions_24h: number;
  executions_7d: number;
  executions_30d: number;
  executions_total: number;
}

export interface WorkflowSummary {
  workflow_name: string;
  executions: number;
}

export interface RecentExecution {
  execution_id: string;
  workflow_name: string;
  trigger_event: string;
  status: string;
  started_at: string;
  duration_ms: number | null;
}

export interface BenchmarkData {
  success: boolean;
  perMinute: BenchmarkBucket[];
  perDay: BenchmarkBucket[];
  perWeek: BenchmarkBucket[];
  perMonth: BenchmarkBucket[];
  summary: BenchmarkSummary;
  byWorkflow: WorkflowSummary[];
  recent: RecentExecution[];
  generatedAt: string;
}

export const getBenchmark = async (): Promise<BenchmarkData> => {
  const res = await api.get('/api/benchmark');
  return res.data;
};
