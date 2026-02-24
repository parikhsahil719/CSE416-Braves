import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { pct, num } from '../utils/format.js';

function SplitPanel({ title, data, color }) {
  return (
    <div className="chart-panel split-panel">
      <h4>{title}</h4>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 18, left: 0, bottom: 18 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="splitLabel" angle={-20} textAnchor="end" height={42} interval={0} />
          <YAxis allowDecimals={false} label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(v, name, ctx) => [num(v), 'Frequency']} labelFormatter={(l, payload) => `${l} (${pct(payload?.[0]?.payload?.shareOfEnsemble ?? 0)})`} />
          <Legend />
          <Bar name="Frequency" dataKey="frequency" fill={color} radius={[4, 4, 0, 0]} />
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
        <SplitPanel title="Race-blind Ensemble" data={payload.series.raceBlind} color="#5373b3" />
        <SplitPanel title="VRA-Constrained Ensemble" data={payload.series.vraConstrained} color="#d1705e" />
      </div>
    </div>
  );
}
