import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { Dashboard } from './pages/Dashboard';
import { FrameAnalytics } from './pages/FrameAnalytics';
import { CameraAnalytics } from './pages/CameraAnalytics';
import { WorkerAnalytics } from './pages/WorkerAnalytics';
import { AIAnalytics } from './pages/AIAnalytics';
import { WorkflowAnalytics } from './pages/WorkflowAnalytics';
import { LiveFrames } from './pages/LiveFrames';
import { RecentFrames } from './pages/RecentFrames';
import { FrameDetails } from './pages/FrameDetails';
import { PipelineLogs } from './pages/PipelineLogs';
import { DeepAnalysis } from './pages/DeepAnalysis';
import { Settings } from './pages/Settings';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/frames" element={<FrameAnalytics />} />
          <Route path="/cameras" element={<CameraAnalytics />} />
          <Route path="/workers" element={<WorkerAnalytics />} />
          <Route path="/ai" element={<AIAnalytics />} />
          <Route path="/workflows" element={<WorkflowAnalytics />} />
          <Route path="/live" element={<LiveFrames />} />
          <Route path="/recent" element={<RecentFrames />} />
          <Route path="/frame/:id" element={<FrameDetails />} />
          <Route path="/logs" element={<PipelineLogs />} />
          <Route path="/deep-analysis" element={<DeepAnalysis />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
