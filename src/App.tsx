import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Benchmark } from './pages/Benchmark';
import { BenchmarkSuite } from './pages/BenchmarkSuite';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/benchmark" replace />} />
        <Route path="/benchmark" element={<Benchmark />} />
        <Route path="/benchmark-suite" element={<BenchmarkSuite />} />
      </Routes>
    </Router>
  );
};

export default App;
