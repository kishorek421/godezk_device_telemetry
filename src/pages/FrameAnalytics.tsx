import React, { useState, useEffect } from 'react';
import { getDashboardSummary, DashboardData } from '../services/api';
import {
  ResponsiveContainer,
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

export const FrameAnalytics: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardSummary().then((res) => {
      setData(res);
      setError(null);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setError(err?.message || 'Failed to load data');
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-slate-400 text-sm animate-pulse">Loading detailed analytics dashboards...</div>;
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[40vh] gap-3">
        <p className="text-slate-500">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Retry</button>
      </div>
    );
  }

  if (!data) return null;

  // Merge all unique time buckets to form a complete unified timeline
  const allTimeBuckets = Array.from(new Set([
    ...(data.throughput || []).map(t => t.time_bucket),
    ...((data as any).queueTimeline || []).map((q: any) => q.time_bucket),
    ...((data as any).aiTrend || []).map((a: any) => a.time_bucket),
    ...((data as any).confidenceTrend || []).map((c: any) => c.time_bucket)
  ].filter(Boolean))).sort();

  // --- Chart 1: Frames Processed Per Minute ---
  const lineChartData = allTimeBuckets.map((bucket) => {
    const timeStr = bucket.split(' ')[1].substring(0, 5);
    const item = data.throughput.find(t => t.time_bucket === bucket);
    return {
      time: timeStr,
      completed: item ? parseInt(item.completed) || 0 : 0,
      failed: item ? parseInt(item.failed) || 0 : 0,
      total: item ? parseInt(item.total) || 0 : 0
    };
  });

  // --- Chart 2: AI Inference Time Trend ---
  const aiTrendData = allTimeBuckets.map((bucket) => {
    const timeStr = bucket.split(' ')[1].substring(0, 5);
    const aiBucket = (data as any).aiTrend?.find((a: any) => a.time_bucket === bucket);
    return {
      time: timeStr,
      latency: aiBucket ? aiBucket.avg_inference || 0 : 0
    };
  });

  // --- Chart 3: Workflow Execution Time ---
  const workflowData = data.workflows.map(w => ({
    name: w.name,
    duration: w.duration
  }));

  // --- Chart 4: Frame Status Distribution ---
  const pieData = [
    { name: 'Completed', value: data.stats.completed, color: '#22C55E' },
    { name: 'Skipped', value: data.stats.skipped, color: '#F59E0B' },
    { name: 'Failed', value: data.stats.failed, color: '#EF4444' }
  ];

  // --- Chart 5: Camera-wise Frame Count ---
  const cameraData = data.cameras.map(c => ({
    name: c.id,
    count: c.received
  }));

  // --- Chart 6: Worker Utilization ---
  const workerData = data.workers.map(w => ({
    name: w.name,
    jobs: w.jobs
  }));

  // --- Chart 7: Queue Length Timeline ---
  const queueData = allTimeBuckets.map((bucket) => {
    const timeStr = bucket.split(' ')[1].substring(0, 5);
    const qBucket = (data as any).queueTimeline?.find((q: any) => q.time_bucket === bucket);
    return {
      time: timeStr,
      length: qBucket ? qBucket.length : 0
    };
  });

  // --- Chart 8: Average Confidence Score ---
  const confidenceData = allTimeBuckets.map((bucket) => {
    const timeStr = bucket.split(' ')[1].substring(0, 5);
    const confBucket = (data as any).confidenceTrend?.find((c: any) => c.time_bucket === bucket);
    return {
      time: timeStr,
      confidence: confBucket ? parseFloat(confBucket.avg_confidence.toFixed(4)) || 0 : 0
    };
  });

  // --- Chart 9: Processing Time Distribution (Histogram) ---
  const hist = (data as any).histogram || { range_1: 0, range_2: 0, range_3: 0, range_4: 0 };
  const histogramData = [
    { range: '<200ms', count: hist.range_1 || 0 },
    { range: '200-500ms', count: hist.range_2 || 0 },
    { range: '500-1000ms', count: hist.range_3 || 0 },
    { range: '1000ms+', count: hist.range_4 || 0 }
  ];

  // --- Chart 10: Success vs Failure Ratio (Donut) ---
  const donutData = [
    { name: 'Success', value: data.stats.completed, color: '#10B981' },
    { name: 'Failure', value: data.stats.failed, color: '#EF4444' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-100">AI Pipeline Performance Center</h2>
        <p className="text-xs text-slate-400 mt-1">10 dedicated telemetry dashboards tracking ingress, AI latencies, and worker capacity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Frames Processed Per Minute (Line Chart) */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">1. Ingress & Processing Rate (per minute)</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 10, color: '#1e293b' }} />
                <Legend fontSize={9} />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="Total Frames" />
                <Line type="monotone" dataKey="completed" stroke="#22C55E" strokeWidth={1.5} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. AI Inference Time Trend (Area Chart) */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">2. AI Inference Time Trend (ms)</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aiTrendData}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 10, color: '#1e293b' }} />
                <Area type="monotone" dataKey="latency" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorLatency)" name="AI Latency" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Workflow Execution Time (Bar Chart) */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">3. Workflow Run Latency comparison (ms)</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 10, color: '#1e293b' }} />
                <Bar dataKey="duration" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Duration (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Frame Status Distribution (Pie Chart) */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">4. Frame Status Distribution (Outcome Breakdown)</h3>
          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 10, color: '#1e293b' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Camera-wise Frame Count (Horizontal Bar Chart) */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">5. Camera Load Distribution</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cameraData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis type="number" stroke="#64748b" fontSize={9} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 10, color: '#1e293b' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Ingested Frames" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Worker Utilization (Bar Chart) */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">6. Worker Capacity Distribution (Jobs handled)</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workerData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 10, color: '#1e293b' }} />
                <Bar dataKey="jobs" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Jobs Run" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7. Queue Length Timeline (Line Chart) */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">7. Queue Length Timeline</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={queueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 10, color: '#1e293b' }} />
                <Line type="step" dataKey="length" stroke="#F59E0B" strokeWidth={2} name="Queue Length" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 8. Average Confidence Score (Area Chart) */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">8. AI Detection Confidence Trend</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} domain={[0.5, 1]} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 10, color: '#1e293b' }} />
                <Area type="monotone" dataKey="confidence" stroke="#10B981" fill="rgba(16, 185, 129, 0.05)" name="Confidence" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 9. Processing Time Distribution (Histogram) */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">9. Total Delay Distribution (Histogram)</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={9} />
                <YAxis stroke="#64748b" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 10, color: '#1e293b' }} />
                <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} name="Frame Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 10. Success vs Failure Ratio (Donut Chart) */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 mb-4 uppercase tracking-wider">10. Engine Success vs Failure Ratio</h3>
          <div className="h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} innerRadius={50} outerRadius={70} dataKey="value">
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 10, color: '#1e293b' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
