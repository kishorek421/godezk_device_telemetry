import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecentFrames, Frame } from '../services/api';
import { Search, Download } from 'lucide-react';

export const RecentFrames: React.FC = () => {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [pipelineFilter, setPipelineFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFrames = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await getRecentFrames();
      setFrames(res);
    } catch (err) {
      console.error(err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrames(true);
    const interval = setInterval(() => {
      fetchFrames(false);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleExportCSV = () => {
    const headers = ['Frame ID', 'Camera ID', 'Pipeline', 'AI Service', 'Workflow', 'Worker ID', 'Confidence', 'Status', 'Detection', 'Received At', 'Duration (ms)'];
    const rows = filteredFrames.map(f => [
      f.frameId, f.cameraId, f.pipeline, f.aiService, f.workflow, f.workerId, f.confidence, f.status, f.detection, f.receivedAt, f.totalTime
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `godezk_frames_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredFrames = frames.filter(f => {
    const matchesSearch = f.frameId.toLowerCase().includes(search.toLowerCase()) || 
                          f.cameraId.toLowerCase().includes(search.toLowerCase()) ||
                          (f.detection && f.detection.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
    const matchesPipeline = pipelineFilter === 'All' || f.pipeline === pipelineFilter;
    return matchesSearch && matchesStatus && matchesPipeline;
  });

  const uniquePipelines = Array.from(new Set(frames.map(f => f.pipeline)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Frame Execution History</h2>
          <p className="text-xs text-slate-400 mt-1">Audit trail and telemetry for all frames processed by the platform.</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-200 border border-slate-200 rounded-lg shadow-sm transition-all"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 border border-slate-200/80 rounded-2xl shadow-sm">
        <div className="relative col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search size={14} />
          </span>
          <input 
            type="text" 
            placeholder="Search Frame ID, Camera, or Detection results..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#0D7A73]"
          />
        </div>

        <div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-[#0D7A73]"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Skipped">Skipped</option>
            <option value="Failed">Failed</option>
            <option value="Processing">Processing</option>
          </select>
        </div>

        <div>
          <select 
            value={pipelineFilter}
            onChange={(e) => setPipelineFilter(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-[#0D7A73]"
          >
            <option value="All">All Pipelines</option>
            {uniquePipelines.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Panel */}
      <div className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-md">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading execution history...</div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-mono bg-slate-50">
                <th className="p-4 font-semibold">Frame ID</th>
                <th className="p-4 font-semibold">Camera</th>
                <th className="p-4 font-semibold">Pipeline</th>
                <th className="p-4 font-semibold">AI Service</th>
                <th className="p-4 font-semibold text-center">Confidence</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Total Time</th>
                <th className="p-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFrames.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">No frames match your filters</td>
                </tr>
              ) : (
                filteredFrames.map((f) => {
                  const statusColors = f.status === 'Completed' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                    : f.status === 'Skipped' 
                      ? 'bg-amber-50 text-amber-600 border-amber-200' 
                      : 'bg-rose-50 text-rose-600 border-rose-200';
                  return (
                    <tr 
                      key={f.frameId} 
                      onClick={() => navigate(`/frame/${f.frameId}`)}
                      className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                    >
                      <td className="p-4 font-mono font-bold text-slate-100">{f.frameId}</td>
                      <td className="p-4 text-slate-200">{f.cameraId}</td>
                      <td className="p-4 text-slate-400">{f.pipeline}</td>
                      <td className="p-4 text-slate-400">{f.aiService}</td>
                      <td className="p-4 text-center font-mono text-indigo-600">{(f.confidence * 100).toFixed(0)}%</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusColors}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-emerald-600">{f.totalTime} ms</td>
                      <td className="p-4 text-right text-slate-400 font-mono">{f.receivedAt.split(' ')[1]}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
