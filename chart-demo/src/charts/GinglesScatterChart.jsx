import { ResponsiveContainer, ComposedChart, Scatter, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { pct, num } from '../utils/format.js';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload.find((entry) => entry?.payload?.precinctId)?.payload;
  if (!row) return null;
  return (
    <div className="tooltip-card">
      <div><strong>{row.precinctId}</strong></div>
      <div>Selected group share: {pct(row.minorityShare)}</div>
      <div>Dem vote share: {pct(row.demVoteShare)}</div>
      <div>Rep vote share: {pct(row.repVoteShare)}</div>
      <div>Total population: {num(row.totalPopulation)}</div>
      <div>Selected-group population: {num(row.minorityPopulation)}</div>
    </div>
  );
}

function mergeCurveData(curves = []) {
  const map = new Map();
  for (const curve of curves) {
    for (const p of curve.points) {
      const key = p.x.toFixed(4);
      if (!map.has(key)) map.set(key, { x: p.x });
      map.get(key)[curve.key] = p.y;
    }
  }
  return [...map.values()].sort((a, b) => a.x - b.x);
}

export default function GinglesScatterChart({ payload }) {
  const demPoints = payload.points.map((p) => ({ ...p, x: p.minorityShare, y: p.demVoteShare }));
  const repPoints = payload.points.map((p) => ({ ...p, x: p.minorityShare, y: p.repVoteShare }));
  const curves = payload.regressionCurves ?? [];
  const curveData = mergeCurveData(curves);

  return (
    <div>
      <div className="meta-inline">
        <span>State: {payload.state}</span>
        <span>Group: {payload.selectedGroup}</span>
        <span>Election: {payload.election}</span>
        <span>Precincts: {payload.points.length}</span>
        <span>Regression: best-fit curve(s) from payload</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.95rem', marginBottom: 6 }}>
        {payload.election} precinct-level vote share vs {payload.selectedGroup} share
      </div>
      <ResponsiveContainer width="100%" height={430}>
        <ComposedChart margin={{ top: 8, right: 30, left: 10, bottom: 12 }}>
          <CartesianGrid stroke="#d1d5db" strokeDasharray="2 2" />
          <XAxis type="number" dataKey="x" domain={[0, 1]} tickFormatter={pct} tick={{ fontSize: 12 }} label={{ value: `Percent ${payload.selectedGroup} within Precinct`, position: 'insideBottom', offset: -2 }} />
          <YAxis type="number" domain={[0, 1]} tickFormatter={pct} tick={{ fontSize: 12 }} label={{ value: 'Vote Share', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '12px' }} />
          <Scatter name="Democratic precinct points" data={demPoints} dataKey="y" fill="#3b82f6" fillOpacity={0.35} />
          <Scatter name="Republican precinct points" data={repPoints} dataKey="y" fill="#ef4444" fillOpacity={0.30} />
          {curves.map((curve) => (
            <Line
              key={curve.key}
              data={curveData}
              type="monotone"
              dataKey={curve.key}
              name={curve.label}
              stroke={curve.party === 'DEM' ? '#2563eb' : '#dc2626'}
              dot={false}
              strokeWidth={2.2}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
