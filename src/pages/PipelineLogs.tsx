import React, { useState, useEffect } from 'react';
import { getPipelineLogs, LogLine } from '../services/api';
import { Terminal, RefreshCw, Trash2, Search, Play, Pause, Loader2 } from 'lucide-react';

export const PipelineLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'INFO' | 'SUCCESS' | 'ERROR'>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeframe, setTimeframe] = useState<'LIVE' | '1' | '3' | '7' | '10' | '30' | 'CUSTOM'>('LIVE');
  const [customDays, setCustomDays] = useState('10');

  const fetchLogs = async (currentTimeframe = timeframe, targetCustomDays = customDays, isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    }
    try {
      if (currentTimeframe === 'LIVE') {
        const data = await getPipelineLogs();
        setLogs(prevLogs => {
          const existingMap = new Map(prevLogs.map(item => [item.id, item]));
          const merged = [...prevLogs];
          
          for (let i = data.length - 1; i >= 0; i--) {
            const newItem = data[i];
            if (!existingMap.has(newItem.id)) {
              merged.push(newItem);
              existingMap.set(newItem.id, newItem);
            }
          }
          
          if (merged.length > 1000) {
            return merged.slice(merged.length - 1000);
          }
          return merged;
        });
      } else {
        const daysVal = currentTimeframe === 'CUSTOM' ? parseInt(targetCustomDays, 10) : parseInt(currentTimeframe, 10);
        if (!isNaN(daysVal)) {
          const data = await getPipelineLogs(daysVal, 1000);
          setLogs(data);
        }
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs('LIVE', customDays, false);
  }, []);

  useEffect(() => {
    if (!autoRefresh || timeframe !== 'LIVE') return;
    const interval = setInterval(() => fetchLogs('LIVE', customDays, true), 2500);
    return () => clearInterval(interval);
  }, [autoRefresh, timeframe, customDays]);

  useEffect(() => {
    let result = logs;

    if (activeFilter !== 'ALL') {
      result = result.filter(log => log.level === activeFilter);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(log => 
        log.message.toLowerCase().includes(query) || 
        log.layer.toLowerCase().includes(query) || 
        log.timestamp.includes(query)
      );
    }

    setFilteredLogs(result);
  }, [logs, search, activeFilter]);

  const clearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
  };

  const handleTimeframeChange = (val: 'LIVE' | '1' | '3' | '7' | '10' | '30' | 'CUSTOM') => {
    setTimeframe(val);
    setLogs([]);
    setFilteredLogs([]);
    if (val !== 'LIVE') {
      setAutoRefresh(false);
      fetchLogs(val, customDays, false);
    } else {
      setAutoRefresh(true);
      fetchLogs('LIVE', customDays, false);
    }
  };

  const handleCustomDaysSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (timeframe === 'CUSTOM') {
      setLogs([]);
      setFilteredLogs([]);
      fetchLogs('CUSTOM', customDays, false);
    }
  };

  const getLevelColor = (level: LogLine['level']) => {
    switch (level) {
      case 'SUCCESS': return 'text-emerald-400 font-semibold';
      case 'ERROR': return 'text-rose-400 font-bold animate-pulse';
      default: return 'text-sky-400';
    }
  };

  const getLayerColor = (layer: string) => {
    const l = layer.toLowerCase();
    if (l.includes('weir')) return 'text-indigo-400';
    if (l.includes('screener')) return 'text-cyan-400';
    if (l.includes('inference')) return 'text-purple-400';
    if (l.includes('worker')) return 'text-teal-400';
    if (l.includes('db')) return 'text-emerald-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)]">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="text-indigo-400" size={22} />
            Pipeline Layer Execution Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time developer console. Monitoring and tracking layer-by-layer frame execution logs directly from backdoor engine.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              autoRefresh 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-slate-800 text-slate-400 border-slate-700/60'
            }`}
          >
            {autoRefresh ? <Play size={12} className="animate-pulse" /> : <Pause size={12} />}
            {autoRefresh ? 'AUTO-TAILING ACTIVE' : 'STREAM PAUSED'}
          </button>
          <button
            onClick={() => fetchLogs(timeframe, customDays, false)}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Force refresh logs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={clearLogs}
            className="p-2 rounded-lg bg-slate-850 border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-all"
            title="Clear console view"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs, layers, errors..."
            className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-950 border border-slate-800/85 focus:outline-none focus:border-indigo-500/50 text-xs text-slate-200"
          />
        </div>

        <div className="relative w-full md:w-48">
          <select
            value={timeframe}
            onChange={(e) => handleTimeframeChange(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
          >
            <option value="LIVE">Live Console Tail</option>
            <option value="1">Last 24 Hours</option>
            <option value="3">Last 3 Days</option>
            <option value="7">Last 7 Days</option>
            <option value="10">Last 10 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="CUSTOM">Custom Days...</option>
          </select>
        </div>

        {timeframe === 'CUSTOM' && (
          <form onSubmit={handleCustomDaysSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="number"
              min="1"
              max="365"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              className="w-20 bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
              placeholder="Days"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-505 hover:text-white text-slate-200 border border-slate-850 font-semibold text-xs transition-all shadow-md"
            >
              Load
            </button>
          </form>
        )}

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          <span className="text-slate-500 text-[10px] uppercase font-mono mr-2 hidden md:inline">Filters:</span>
          {(['ALL', 'INFO', 'SUCCESS', 'ERROR'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                activeFilter === filter 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' 
                  : 'bg-slate-850 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Monospace Console Viewport */}
      <div className="flex-1 min-h-0 bg-slate-950 border border-slate-900 rounded-3xl p-5 font-mono text-[11px] leading-relaxed overflow-hidden flex flex-col shadow-inner">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3 text-[10px] text-slate-500 font-semibold select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            <span className="ml-2 font-mono text-slate-400">godezk_telemetry_tail.log</span>
          </div>
          <div>Lines: {filteredLogs.length} / {logs.length}</div>
        </div>

        {/* Scrollable console messages */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar selection:bg-indigo-500/30 selection:text-white">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 font-sans select-none animate-pulse">
              <Loader2 className="animate-spin text-indigo-400" size={20} />
              <span>Loading telemetry logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-600 italic">
              No execution logs match the current filters
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-3 hover:bg-slate-900/40 py-0.5 rounded px-1 group transition-colors">
                <span className="text-slate-600 select-none font-medium">{log.timestamp.split(' ')[1]}</span>
                <span className={`w-16 uppercase select-none ${getLevelColor(log.level)}`}>
                  [{log.level}]
                </span>
                <span className={`w-28 uppercase select-none font-semibold ${getLayerColor(log.layer)}`}>
                  {log.layer}
                </span>
                <span className="text-slate-300 group-hover:text-slate-100 break-all">
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
