import axios from 'axios';

const api = axios.create({
  baseURL: '',
});

export interface BenchmarkBucket {
  time_bucket: string;
  frames: number;
}

export interface BenchmarkSummary {
  frames_24h: number;
  frames_7d: number;
  frames_30d: number;
  frames_total: number;
}

export interface BenchmarkData {
  success: boolean;
  perMinute: BenchmarkBucket[];
  perDay: BenchmarkBucket[];
  perWeek: BenchmarkBucket[];
  perMonth: BenchmarkBucket[];
  summary: BenchmarkSummary;
  generatedAt: string;
}

export const getBenchmark = async (): Promise<BenchmarkData> => {
  const res = await api.get('/api/benchmark');
  return res.data;
};
