import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import '../../styles/chart-integration.css';
import { pct } from '../utils/chartFormat.js';

function withTaperedTails(points = []) {
  if (points.length < 2) return points;

  const sorted = [...points].sort((a, b) => a.xSupportShare - b.xSupportShare);
  const deltas = [];
  for (let index = 1; index < sorted.length; index += 1) {
    deltas.push(sorted[index].xSupportShare - sorted[index - 1].xSupportShare);
  }

  const minDelta = Math.min(...deltas.filter((delta) => delta > 0));
  const pad = Number.isFinite(minDelta) ? Math.max(0.02, minDelta * 0.8) : 0.05;
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const leftTail = {
    xSupportShare: Math.max(0, Number((first.xSupportShare - pad).toFixed(4))),
    density: 0,
  };
  const rightTail = {
    xSupportShare: Math.min(1, Number((last.xSupportShare + pad).toFixed(4))),
    density: 0,
  };

  return [leftTail, ...sorted, rightTail];
}

function flattenSeries(series) {
  const rows = new Map();
  for (const entry of series) {
    const paddedPoints = withTaperedTails(entry.points ?? []);
    for (const point of paddedPoints) {
      const key = point.xSupportShare.toFixed(4);
      if (!rows.has(key)) rows.set(key, { xSupportShare: point.xSupportShare });
      rows.get(key)[entry.key] = point.density;
    }
  }
  return [...rows.values()].sort((a, b) => a.xSupportShare - b.xSupportShare);
}

function SupportTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const visibleSeries = payload.filter((entry) => entry.value != null);
  return (
    <div className="chartTooltip chartTooltipWide">
      <div className="chartTooltipTitle">Estimated Support {pct(label)}</div>
      {visibleSeries.map((entry) => (
        <div key={entry.name} className="chartTooltipRow">
          <span className="chartTooltipSeries" style={{ color: entry.color }}>
            {entry.name}
          </span>
          <span>{Number(entry.value).toFixed(3)} density</span>
        </div>
      ))}
    </div>
  );
}

export default function EiSupportChart({ payload, showHeader = true, title, eyebrow, subtitle }) {
  const data = flattenSeries(payload.series);
  const colors = [
    { stroke: '#2a9d8f', fill: '#2a9d8f66' },
    { stroke: '#d48b19', fill: '#d48b194d' },
    { stroke: '#264653', fill: '#2646534d' },
  ];

  const maxDensity = Math.max(0, ...payload.series.flatMap((series) => (series.points ?? []).map((point) => point.density)));
  const yMax = Math.max(1, Math.ceil(maxDensity * 1.15));

  return (
    <div className="chartPanel chartPanelEi">
      {showHeader ? (
        <>
          <div className="chartPanelEyebrow">{eyebrow ?? "GUI-12"}</div>
          <h3 className="chartPanelTitle">{title ?? `Support for ${payload.selectedCandidate}`}</h3>
          <p className="chartPanelSubtitle">{subtitle ?? "Estimated support distribution by group"}</p>
        </>
      ) : null}
      <div className="chartFrame chartFrameEi">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 18, left: 12, bottom: 30 }}>
            <CartesianGrid stroke="#d4d4d8" strokeDasharray="3 3" />
            <XAxis
              dataKey="xSupportShare"
              type="number"
              domain={[0, 1]}
              tickFormatter={(value) => pct(value, 0)}
              tick={{ fontSize: 12 }}
              label={{ value: 'Estimated Support', position: 'bottom', offset: 8, fontSize: 12 }}
            />
            <YAxis
              domain={[0, yMax]}
              tick={{ fontSize: 12 }}
              label={{ value: 'Density', angle: -90, position: 'insideLeft', offset: -2, style: { fontSize: 12 } }}
            />
            <Tooltip content={<SupportTooltip />} cursor={false} />
            <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '0.25rem' }} />
            {payload.series.map((series, index) => (
              <Area
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stroke={colors[index % colors.length].stroke}
                fill={colors[index % colors.length].fill}
                fillOpacity={1}
                dot={false}
                activeDot={false}
                strokeWidth={2.3}
                isAnimationActive={false}
                connectNulls
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
