import React, { useEffect, useMemo, useState } from 'react';
import { getBenchmarkSuite, BenchmarkSuiteData, ComponentMetrics } from '../services/api';
import { BarChart2, Gauge, Activity, Cpu, Database, Layers, Zap, ZapOff } from 'lucide-react';

const COMPONENT_TABS: string[] = [
  'RtspHandler',
  'FunctionAdapter',
  'DeviceConnectionManager',
  'FrameWeir',
  'FrameBus',
  'Queuer',
  'Deployment Lookup',
  'PreScreener',
  'PerceptionGate',
  'Inference Service',
  'SOMA Gate',
  'workflow_runner_queue',
  'QueueHandler',
  'Redis Executor',
  'WorkerPool',
  'executeGraph',
  'Storage Nodes',
  'Notification Nodes',
  'Database Nodes',
  'Overall Pipeline',
];

function StatRow({ label, value, unit, emphasize = false }: { label: string; value: React.ReactNode; unit?: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={emphasize ? 'font-semibold text-slate-100' : 'text-slate-200'}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit ? <span className="ml-1 text-[10px] text-slate-400">{unit}</span> : null}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
      <h3 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function MetricPanel({ data }: { data: ComponentMetrics | undefined }) {
  const latency = data?.latency;
  const throughput = data?.throughput;
  const resource = data?.resource;
  const reliability = data?.reliability;
  const queue = data?.queue;

  const hasLatency = !!latency && typeof latency.avg === 'number';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Section title="Latency">
          {hasLatency ? (
            <div className="space-y-1.5">
              <StatRow label="Avg" value={Math.round(latency!.avg)} unit={latency!.unit} emphasize />
              <StatRow label="P50" value={Math.round(latency!.p50)} unit={latency!.unit} />
              <StatRow label="P95" value={Math.round(latency!.p95)} unit={latency!.unit} />
              <StatRow label="P99" value={Math.round(latency!.p99)} unit={latency!.unit} />
              <div className="pt-1 border-t border-slate-100" />
              <StatRow label="Samples" value={latency!.count} />
              {latency!.failed !== undefined ? <StatRow label="Failures" value={latency!.failed} /> : null}
            </div>
          ) : (
            <div className="text-slate-400 text-xs">No latency samples available</div>
          )}
        </Section>

        <Section title="Throughput">
          {throughput ? (
            <div className="space-y-1.5">
              {throughput.perSecond !== undefined && <StatRow label="Per Second" value={throughput.perSecond} unit={throughput.unit} />}
              {throughput.perMinute !== undefined && <StatRow label="Per Minute" value={throughput.perMinute} unit={throughput.unit} />}
              {throughput.total !== undefined && <StatRow label="Total Samples" value={throughput.total} />}
            </div>
          ) : (
            <div className="text-slate-400 text-xs">No throughput computed</div>
          )}
        </Section>

        <Section title="Resource / Reliability">
          <div className="space-y-1.5">
            {resource?.activeWorkers !== undefined && <StatRow label="Active Workers" value={resource.activeWorkers} />}
            {resource?.cpuPct !== undefined && <StatRow label="CPU" value={resource.cpuPct} unit="%" />}
            {resource?.rssMb !== undefined && <StatRow label="Memory" value={resource.rssMb} unit="MB" />}
            {resource?.gpuUtil !== undefined && <StatRow label="GPU Util" value={resource.gpuUtil} unit="%" />}
            {resource?.gpuMemMb !== undefined && <StatRow label="GPU Memory" value={resource.gpuMemMb} unit="MB" />}
            {reliability?.failures !== undefined && <StatRow label="Failures" value={reliability.failures} />}
            {reliability?.retries !== undefined && <StatRow label="Retries" value={reliability.retries} />}
            {reliability?.dropped !== undefined && <StatRow label="Dropped" value={reliability.dropped} />}
            {reliability?.timeouts !== undefined && <StatRow label="Timeouts" value={reliability.timeouts} />}
            {reliability?.queueOverflow !== undefined && <StatRow label="Queue Overflow" value={reliability.queueOverflow} />}
            {queue && (
              <div className="pt-1 border-t border-slate-100 mt-1">
                <StatRow label="Queue Size (now)" value={queue.currentSize ?? '—'} />
                <StatRow label="Queue Avg Size" value={queue.avgSize ?? '—'} />
                <StatRow label="Queue Peak Size" value={queue.peakSize ?? '—'} />
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Benchmark categories scaffold (placeholders ready for future wiring) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Section title="Latency (Trace)">
          <p className="text-xs text-slate-400">Compute from stage start/end timestamps. Will populate as more instrumentation becomes available.</p>
        </Section>
        <Section title="Scalability">
          <p className="text-xs text-slate-400">Compare metrics for 1/5/10/25/50/100 cameras. To be computed from scenario runs.</p>
        </Section>
        <Section title="Stress Testing">
          <p className="text-xs text-slate-400">Max FPS, large images, network delay/packet loss, recovery time. To be captured via targeted tests.</p>
        </Section>
      </div>
    </div>
  );
}

export const BenchmarkSuite: React.FC = () => {
  const [data, setData] = useState<BenchmarkSuiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string>('Overall Pipeline');
  const [hours, setHours] = useState<number>(24);
  const REFRESH_MS = 10000; // 10s for near real-time feel

  const refresh = async (h = hours) => {
    try {
      setLoading(true);
      const res = await getBenchmarkSuite(h);
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load benchmark suite');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh(24);
    const id = setInterval(() => refresh(hours), REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const compMetrics: ComponentMetrics | undefined = useMemo(() => {
    if (!data) return undefined;
    return data.components[active];
  }, [data, active]);

  return (
    <div className="min-h-screen bg-[#0a0e1f] bg-[radial-gradient(ellipse_at_top,rgba(56,89,255,0.15),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.08),transparent_50%)] px-6 py-8 lg:px-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2"><BarChart2 size={18} className="text-cyan-400" /> Benchmark Suite</h1>
          <p className="text-xs text-slate-400 mt-1">Window: last {data?.window.hours ?? hours}h • {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={hours}
            onChange={(e) => { const v = Number(e.target.value); setHours(v); refresh(v); }}
            className="bg-[#0f1326] border border-white/10 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            title="Select time window"
          >
            {[6, 12, 24, 48, 72].map((h) => (
              <option key={h} value={h}>{h} hours</option>
            ))}
          </select>
          <button
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:brightness-110"
            onClick={() => refresh(hours)}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left vertical tabs */}
        <aside className="md:w-64 w-full md:shrink-0">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur md:sticky md:top-6 max-h-[70vh] md:max-h-[calc(100vh-160px)] overflow-y-auto">
            <div className="flex md:flex-col flex-row flex-wrap gap-2">
              {COMPONENT_TABS.map((tab) => {
                const isActive = active === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActive(tab)}
                    className={`w-full md:w-full px-3 py-2 rounded-lg text-xs border text-left whitespace-normal break-words leading-snug transition-all ${isActive ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-white/[0.06] border-white/10 text-slate-200 hover:bg-white/[0.08]'}`}
                    title={tab}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right content */}
        <section className="flex-1 space-y-6">
          {/* Body */}
          {loading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur text-slate-300 text-xs">Loading benchmark suite...</div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-200 text-xs">{error}</div>
          ) : (
            <MetricPanel data={compMetrics} />
          )}

          {/* Success Criteria scaffold */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
            <h3 className="text-xs font-semibold text-slate-300 mb-3 uppercase tracking-wider">Success Criteria (Targets)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-200">
              <div className="flex items-center gap-2"><Gauge size={14} className="text-emerald-500" /> <span>End-to-End Latency &lt; 500 ms</span></div>
              <div className="flex items-center gap-2"><Activity size={14} className="text-indigo-500" /> <span>Inference Time &lt; 200 ms</span></div>
              <div className="flex items-center gap-2"><Cpu size={14} className="text-amber-500" /> <span>Worker CPU &lt; 70%</span></div>
              <div className="flex items-center gap-2"><Database size={14} className="text-sky-500" /> <span>Queue Wait &lt; 50 ms</span></div>
              <div className="flex items-center gap-2"><Layers size={14} className="text-purple-500" /> <span>Graph Exec &lt; 100 ms</span></div>
              <div className="flex items-center gap-2"><Zap size={14} className="text-teal-500" /> <span>Dropped Frames &lt; 1%</span></div>
              <div className="flex items-center gap-2"><ZapOff size={14} className="text-rose-500" /> <span>Availability ≥ 99.9%</span></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
