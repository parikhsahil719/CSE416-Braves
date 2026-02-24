import { ResponsiveContainer, ScatterChart, Scatter, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { pct, num } from '../utils/format.js';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="tooltip-card">
      <div><strong>{p.precinctId}</strong></div>
      <div>Selected group share: {pct(p.minorityShare)}</div>
      <div>Dem vote share: {pct(p.demVoteShare)}</div>
      <div>Rep vote share: {pct(p.repVoteShare)}</div>
      <div>Total population: {num(p.totalPopulation)}</div>
      <div>Selected-group population: {num(p.minorityPopulation)}</div>
    </div>
  );
}

export default function GinglesScatterChart({ payload }) {
  const demPoints = payload.points.map((p) => ({ ...p, y: p.demVoteShare }));
  const repPoints = payload.points.map((p) => ({ ...p, y: p.repVoteShare }));

  return (
    <div>
      <div className="meta-inline">
        <span>State: {payload.state}</span>
        <span>Group: {payload.selectedGroup}</span>
        <span>Election: {payload.election}</span>
        <span>Precincts: {payload.points.length}</span>
      </div>
      <div style={{ textAlign: 'center', fontSize: '0.95rem', marginBottom: 6 }}>
        {payload.election} precinct-level vote share vs {payload.selectedGroup} share
      </div>
      <ResponsiveContainer width="100%" height={430}>
        <ScatterChart margin={{ top: 8, right: 30, left: 10, bottom: 12 }}>
          <CartesianGrid stroke="#d1d5db" strokeDasharray="2 2" />
          <XAxis type="number" dataKey="minorityShare" domain={[0, 1]} tickFormatter={pct} tick={{ fontSize: 12 }} label={{ value: `Percent ${payload.selectedGroup} within Precinct`, position: 'insideBottom', offset: -2 }} />
          <YAxis type="number" dataKey="y" domain={[0, 1]} tickFormatter={pct} tick={{ fontSize: 12 }} label={{ value: 'Vote Share', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '12px' }} />
          <Scatter name="Democratic" data={demPoints} fill="#3b82f6" fillOpacity={0.35} lineType="fitting" line={{ stroke: '#2563eb', strokeWidth: 2 }} />
          <Scatter name="Republican" data={repPoints} fill="#ef4444" fillOpacity={0.30} lineType="fitting" line={{ stroke: '#dc2626', strokeWidth: 2 }} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
