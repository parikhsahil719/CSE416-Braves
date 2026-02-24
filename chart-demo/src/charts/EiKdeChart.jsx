import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';

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
  const colors = ['#60a5fa', '#f59e0b'];
  return (
    <div>
      <div className="meta-inline"><span>State: {payload.state}</span><span>Metric: {payload.metricLabel}</span></div>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 6, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="x" domain={payload.domain ?? ['auto', 'auto']} />
          <YAxis />
          <Tooltip formatter={(v) => [Number(v).toFixed(3), 'Density']} />
          <Legend />
          {payload.thresholdX != null ? <ReferenceLine x={payload.thresholdX} stroke="#64748b" strokeDasharray="4 4" /> : null}
          {payload.series.map((s, idx) => (
            <Line key={s.key} dataKey={s.key} name={s.label} type="monotone" dot={false} strokeWidth={2} stroke={colors[idx % colors.length]} />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {payload.thresholdProbability != null ? <div className="meta-inline"><span>{payload.thresholdLabel}: {(payload.thresholdProbability * 100).toFixed(1)}%</span></div> : null}
    </div>
  );
}
