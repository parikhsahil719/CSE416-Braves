import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import '../../styles/chart-integration.css';
import { pct, num } from '../utils/chartFormat.js';

function SplitTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  return (
    <div className="chartTooltip">
      <div><strong>{label}</strong></div>
      <div>Frequency: {num(row.frequency)}</div>
      <div>Share of ensemble: {pct(row.shareOfEnsemble)}</div>
      <div>Republican wins: {row.repWins}</div>
      <div>Democratic wins: {row.demWins}</div>
    </div>
  );
}

export default function SingleEnsembleSplitsChart({ title, buckets, totalDistricts, ensembleSize }) {
  return (
    <div className="chartPanel">
      <h3 className="chartPanelTitle">{title}</h3>
      <div className="chartPanelMeta">
        <span>{totalDistricts} districts</span>
        <span>{num(ensembleSize)} plans</span>
      </div>
      <div className="chartFrame">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 10, right: 8, left: 0, bottom: 18 }}>
            <CartesianGrid stroke="#d4d4d8" strokeDasharray="2 2" />
            <XAxis dataKey="splitLabel" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip content={<SplitTooltip />} />
            <Bar dataKey="frequency" fill="#1f2f59" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
