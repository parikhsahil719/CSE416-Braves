import { ResponsiveContainer, ScatterChart, Scatter, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { pct, num } from '../utils/format.js';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="tooltip-card">
      <div><strong>{p.precinctId}</strong></div>
      <div>Minority share: {pct(p.minorityShare)}</div>
      <div>Dem vote share: {pct(p.demVoteShare)}</div>
      <div>Rep vote share: {pct(p.repVoteShare)}</div>
      <div>Total pop: {num(p.totalPopulation)}</div>
      <div>Minority pop: {num(p.minorityPopulation)}</div>
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
      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ top: 12, right: 22, left: 8, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="minorityShare" domain={[0, 1]} tickFormatter={pct} label={{ value: 'Selected Group Share in Precinct', position: 'insideBottom', offset: -4 }} />
          <YAxis type="number" dataKey="y" domain={[0, 1]} tickFormatter={pct} label={{ value: 'Party Vote Share', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Scatter name="Democratic vote share" data={demPoints} fill="#2b6cb0" />
          <Scatter name="Republican vote share" data={repPoints} fill="#c53030" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
