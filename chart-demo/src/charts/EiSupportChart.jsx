import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { pct } from '../utils/format.js';

function flattenSeries(series) {
  const byX = new Map();
  for (const s of series) {
    for (const p of s.points) {
      const key = p.xSupportShare.toFixed(4);
      if (!byX.has(key)) byX.set(key, { xSupportShare: p.xSupportShare });
      byX.get(key)[s.key] = p.density;
    }
  }
  return [...byX.values()].sort((a, b) => a.xSupportShare - b.xSupportShare);
}

export default function EiSupportChart({ payload }) {
  const data = flattenSeries(payload.series);
  const colors = ['#2a9d8f', '#e9c46a', '#264653', '#e76f51'];
  return (
    <div>
      <div className="meta-inline">
        <span>State: {payload.state}</span>
        <span>Candidate: {payload.selectedCandidate}</span>
        <span>Election: {payload.election}</span>
      </div>
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="xSupportShare" type="number" domain={[0, 1]} tickFormatter={pct} label={{ value: 'Estimated Support Share', position: 'insideBottom', offset: -4 }} />
          <YAxis label={{ value: 'Density', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(v) => [Number(v).toFixed(3), 'Density']} labelFormatter={(v) => `Support ${pct(v)}`} />
          <Legend />
          {payload.series.map((s, idx) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={colors[idx % colors.length]} dot={false} strokeWidth={2} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {payload.series.some((s) => s.confidenceScore != null) ? (
        <div className="confidence-row">
          {payload.series.map((s) => (
            <span key={s.key}>{s.label}: confidence {pct(s.confidenceScore)}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
