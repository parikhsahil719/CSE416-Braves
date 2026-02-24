import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';
import { pct } from '../utils/format.js';

export default function VoteShareSeatShareChart({ payload }) {
  return (
    <div>
      <div className="meta-inline"><span>State: {payload.state}</span><span>Enabled: {payload.enabled ? 'Yes' : 'No'}</span></div>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={payload.points} margin={{ top: 12, right: 20, left: 6, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" dataKey="voteShare" domain={[0, 1]} tickFormatter={pct} />
          <YAxis type="number" dataKey="seatShare" domain={[0, 1]} tickFormatter={pct} />
          <Tooltip formatter={(v, name) => [pct(v), name === 'seatShare' ? 'Seat share' : 'Vote share']} labelFormatter={(v) => `Vote share ${pct(v)}`} />
          <Legend />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="#64748b" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="seatShare" name="Seat share curve" stroke="#2563eb" dot={false} strokeWidth={2.5} />
        </LineChart>
      </ResponsiveContainer>
      {!payload.enabled && payload.disabledReason ? <div className="warning-note">Disabled note: {payload.disabledReason}</div> : null}
    </div>
  );
}
