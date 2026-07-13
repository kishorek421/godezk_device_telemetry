# GoDezk Device Telemetry (Frame Analytics Dashboard)

A real-time, high-performance monitoring and visualization dashboard for the GoDezk video frame ingestion, gating, and downstream AI workflow pipeline.

---

## What It Does

This dashboard serves as the central observability console for the video processing pipeline. It connects directly to the GoDezk Backdoor Backend Telemetry API to monitor frame throughput, pipeline gate latencies, and resource consumption.

### Key Capabilities

1. **Frame Ingestion & Gating Flow Visualizer**
   - Tracks each frame through its **11 critical gating stages**:
     1. **Frame Ingested**: RTSP camera stream frame arrival.
     2. **FrameWeir.score()**: Motion-scored pre-filter to drop redundant/static frames (~60-80% filtered out).
     3. **FrameBus.publish()**: In-process zero-latency frame bridge (bypasses Redis for local streams).
     4. **PerceptionGate.infer()**: Semaphore locking and identity cooldown checking.
     5. **SOMA.canAccept()**: Self-Optimizing Memory pressure gate.
     6. **PostgreSQL Queue**: Database-driven workflow job queue.
     7. **AI Inference**: GPU inference execution.
     8. **Decision Gate**: Rules and post-inference checks.
     9. **Worker Execution**: Node task runner execution.
     10. **Database Log**: Audit trail logging.
     11. **Completed**: Final state.
   - Displays real-time **CPU usage** and **RAM allocation** for each individual stage.

2. **Metrics & Performance Monitoring**
   - **KPI Metrics**: Total frames ingested, skipped, completed runs, failures, active worker threads, and queue lengths.
   - **Latency Charts**: Real-time graph showing millisecond breakdowns per layer (Weir, PreScreen, AI Gate, Engine).
   - **Throughput Graphs**: Live tracking of completed vs. failed frames per minute.
   - **Failure Analysis**: Real-time console displaying logs and error traces of pipeline exceptions.

3. **System & Model Profiling**
   - Displays host system hardware usage (CPU threads, total/free memory, server uptime).
   - Tracks per-model performance profiling (Runs, Avg CPU time, RAM delta, peak RSS memory, and success/fail counts).

---

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Recharts (for live graphing), Lucide Icons.
- **Backend (Proxy)**: Express.js (Node.js) acting as a secure API gateway to telemetry resources.
- **Data Source**: GoDezk Backdoor Backend API (`/api/telemetry`).

---

## Configuration

The dashboard is configured using environment variables in a root `.env` file:

```env
# Port the dashboard server runs on
ANALYTICS_PORT=3031

# URL of the GoDezk Backdoor Backend API
BACKEND_URL=http://localhost:8090
```

---

## Development & Run Commands

### 1. Install Dependencies
```bash
# Install backend proxy dependencies
npm install

# Install frontend client dependencies
cd client
npm install
```

### 2. Run Locally
```bash
# Start backend proxy (from dashboard root)
npm start

# Start frontend dev server (from client directory)
cd client
npm run dev
```
Open `http://localhost:3030` to access the live dashboard with hot-reloading.
