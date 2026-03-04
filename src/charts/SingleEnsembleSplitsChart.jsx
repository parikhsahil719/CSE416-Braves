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

export default function SingleEnsembleSplitsChart({ eyebrow, title, subtitle, buckets, totalDistricts, ensembleSize, showHeader = true }) {
  return (
    <div className="chartPanel chartPanelEnsemble">
      {showHeader ? (
        <>
          {eyebrow ? <div className="chartPanelEyebrow">{eyebrow}</div> : null}
          <h3 className="chartPanelTitle">{title}</h3>
          {subtitle ? <div className="chartPanelSubtitle">{subtitle}</div> : null}
        </>
      ) : null}
      <div className="chartPanelMeta">
        <span>{totalDistricts} districts</span>
        <span>{num(ensembleSize)} plans</span>
      </div>
      <div className="chartFrame chartFrameEnsemble">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 12, right: 12, left: 8, bottom: 28 }}>
            <CartesianGrid stroke="#d4d4d8" strokeDasharray="3 3" />
            <XAxis dataKey="splitLabel" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip content={<SplitTooltip />} />
            <Bar dataKey="frequency" fill="#1f2f59" radius={[4, 4, 0, 0]} barSize={72} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
