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

// ── Benchmark Suite (per-component) ───────────────────────────────
export interface LatencyStats {
  unit: 'ms';
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  count: number;
  failed?: number;
}

export interface ThroughputStats {
  unit: string; // executions | frames | inferences
  perSecond?: number;
  perMinute?: number;
  total?: number;
}

export interface ResourceStats {
  activeWorkers?: number;
  cpuPct?: number;
  rssMb?: number;
  gpuUtil?: number;
  gpuMemMb?: number;
}

export interface ReliabilityStats {
  failures?: number;
  retries?: number;
  dropped?: number;
  timeouts?: number;
  queueOverflow?: number;
}

export interface QueueStats {
  currentSize?: number;
  avgSize?: number;
  peakSize?: number;
}

export interface ComponentMetrics {
  latency?: LatencyStats | null;
  throughput?: ThroughputStats | null;
  resource?: ResourceStats | null;
  reliability?: ReliabilityStats | null;
  queue?: QueueStats | null;
}

export interface BenchmarkSuiteData {
  success: boolean;
  window: { hours: number };
  components: Record<string, ComponentMetrics>;
  generatedAt: string;
}

export const getBenchmarkSuite = async (hours = 24): Promise<BenchmarkSuiteData> => {
  const res = await api.get('/api/bench-suite', { params: { hours } });
  return res.data;
};
