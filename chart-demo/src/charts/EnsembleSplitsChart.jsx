import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { pct, num } from '../utils/format.js';

function SplitPanel({ title, data, color }) {
  return (
    <div className="chart-panel split-panel">
      <h4>{title}</h4>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 18 }}>
          <CartesianGrid stroke="#d1d5db" strokeDasharray="2 2" />
          <XAxis dataKey="splitLabel" angle={-20} textAnchor="end" height={42} interval={0} tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(v) => [num(v), 'Frequency']} labelFormatter={(l, payload) => `${l} (${pct(payload?.[0]?.payload?.shareOfEnsemble ?? 0)})`} />
          <Bar dataKey="frequency" fill={color} stroke="#374151" strokeWidth={0.4} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function EnsembleSplitsChart({ payload }) {
  return (
    <div>
      <div className="meta-inline">
        <span>State: {payload.state}</span>
        <span>Districts: {payload.totalDistricts}</span>
        <span>Ensemble Size: {num(payload.ensembleSize)}</span>
      </div>
      <div className="split-grid">
        <SplitPanel title="Race-blind Ensemble" data={payload.series.raceBlind} color="#8fb3d9" />
        <SplitPanel title="VRA-Constrained Ensemble" data={payload.series.vraConstrained} color="#e7a38c" />
      </div>
    </div>
  );
}
