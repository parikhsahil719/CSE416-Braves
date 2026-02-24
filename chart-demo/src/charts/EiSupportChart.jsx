import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
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
  const colors = [
    { stroke: '#2a9d8f', fill: '#2a9d8f55' },
    { stroke: '#e9a83a', fill: '#e9a83a55' },
    { stroke: '#264653', fill: '#26465333' },
    { stroke: '#e76f51', fill: '#e76f5133' },
  ];

  return (
    <div>
      <div className="meta-inline">
        <span>State: {payload.state}</span>
        <span>Candidate: {payload.selectedCandidate}</span>
        <span>Election: {payload.election}</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: '1.02rem', marginBottom: 4 }}>
        Support for {payload.selectedCandidate}
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 8, right: 18, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="#d1d5db" strokeDasharray="2 2" />
          <XAxis dataKey="xSupportShare" type="number" domain={[0, 1]} tickFormatter={pct} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [Number(v).toFixed(3), 'Density']} labelFormatter={(v) => `Support ${pct(v)}`} />
          <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '12px' }} />
          {payload.series.map((s, idx) => (
            <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={colors[idx % colors.length].stroke} fill={colors[idx % colors.length].fill} fillOpacity={1} dot={false} strokeWidth={1.8} />
          ))}
        </AreaChart>
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
