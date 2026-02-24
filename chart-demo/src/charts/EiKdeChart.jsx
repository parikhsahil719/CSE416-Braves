import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';

function mergeSeries(series) {
  const map = new Map();
  for (const s of series) {
    for (const p of s.points) {
      const key = p.x.toFixed(4);
      if (!map.has(key)) map.set(key, { x: p.x });
      map.get(key)[s.key] = p.density;
    }
  }
  return [...map.values()].sort((a, b) => a.x - b.x);
}

export default function EiKdeChart({ payload }) {
  const data = mergeSeries(payload.series);
  const colors = [
    { stroke: '#7aa6d9', fill: '#7aa6d955' },
    { stroke: '#f2b36f', fill: '#f2b36f55' },
  ];
  return (
    <div>
      <div className="meta-inline"><span>State: {payload.state}</span><span>Metric: {payload.metricLabel}</span></div>
      <div style={{ textAlign: 'center', fontSize: '1rem', marginBottom: 4 }}>Polarization KDE for {payload.selectedCandidate || 'Hardy'}</div>
      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 6, bottom: 8 }}>
          <CartesianGrid stroke="#d1d5db" strokeDasharray="2 2" />
          <XAxis type="number" dataKey="x" domain={payload.domain ?? ['auto', 'auto']} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [Number(v).toFixed(3), 'Density']} />
          <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '12px' }} />
          {payload.thresholdX != null ? <ReferenceLine x={payload.thresholdX} stroke="#6b7280" strokeDasharray="4 4" /> : null}
          {payload.series.map((s, idx) => (
            <Area key={s.key} dataKey={s.key} name={s.label} type="monotone" dot={false} strokeWidth={1.8} stroke={colors[idx % colors.length].stroke} fill={colors[idx % colors.length].fill} fillOpacity={1} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      {payload.thresholdProbability != null ? <div className="meta-inline"><span>{payload.thresholdLabel}: {(payload.thresholdProbability * 100).toFixed(1)}%</span></div> : null}
    </div>
  );
}
