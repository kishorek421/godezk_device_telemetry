import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Cpu,
  Activity,
  GitBranch,
  Play,
  History,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  RefreshCw,
  Bell,
  Sun,
  Moon,
  Terminal,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onRefresh?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onRefresh }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [time, setTime] = useState(new Date());
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Frame Analytics', path: '/frames', icon: Activity },
    { name: 'Camera Analytics', path: '/cameras', icon: Video },
    { name: 'Worker Analytics', path: '/workers', icon: Cpu },
    { name: 'AI Analytics', path: '/ai', icon: Play },
    { name: 'Workflow Analytics', path: '/workflows', icon: GitBranch },
    { name: 'Live Frames', path: '/live', icon: Play },
    { name: 'Recent Frames', path: '/recent', icon: History },
    { name: 'Pipeline Logs', path: '/logs', icon: Terminal },
    { name: 'Deep Analysis', path: '/deep-analysis', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-darkBg text-slate-100 font-outfit">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 relative ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[#0D7A73]">GoDezk Telemetry</span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wide">Frame Analytics Dashboard</span>
            </div>
          )}
          {collapsed && (
            <span className="font-bold text-sm mx-auto text-[#0D7A73]">GD</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 absolute -right-3 top-5 z-20 shadow-sm"
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-[#0D7A73] text-white shadow-md shadow-teal-700/10'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-50'
                }`}
              >
                <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer / Version */}
        <div className="p-4 border-t border-slate-200 text-center">
          {!collapsed && <p className="text-[10px] text-slate-400 font-mono">v1.2.0-dev</p>}
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          {/* Project Name / Left Title */}
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-slate-100">
              GoDezk Frame Analytics
            </h2>
            <div className="relative hidden md:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search frame ID, camera..."
                className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#0D7A73] w-64 transition-all"
              />
            </div>
          </div>

          {/* Right Widgets */}
          <div className="flex items-center gap-4">
            {/* Clock */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <Clock size={12} />
              <span>{time.toTimeString().split(' ')[0]}</span>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all shadow-sm"
                title="Refresh Data"
              >
                <RefreshCw size={14} />
              </button>
            )}

            {/* Notification Trigger */}
            <button className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 relative shadow-sm">
              <Bell size={14} />
              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            </button>

            {/* Dark / Light Mode */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 shadow-sm"
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Avatar */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#0D7A73] to-teal-500 flex items-center justify-center font-bold text-xs text-white shadow-md">
                DEV
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
