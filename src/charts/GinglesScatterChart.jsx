import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import '../../styles/chart-integration.css';
import { pct, num } from '../utils/chartFormat.js';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload.find((entry) => entry?.payload?.precinctId)?.payload;
  if (!row) return null;

  return (
    <div className="chartTooltip">
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
    for (const point of curve.points ?? []) {
      const key = point.x.toFixed(4);
      if (!map.has(key)) map.set(key, { x: point.x });
      map.get(key)[curve.key] = point.y;
    }
  }
  return [...map.values()].sort((a, b) => a.x - b.x);
}

export default function GinglesScatterChart({ payload, compact = false }) {
  const demPoints = payload.points.map((point) => ({
    ...point,
    x: point.minorityShare,
    y: point.demVoteShare,
  }));
  const repPoints = payload.points.map((point) => ({
    ...point,
    x: point.minorityShare,
    y: point.repVoteShare,
  }));
  const curves = payload.regressionCurves ?? [];
  const curveData = mergeCurveData(curves);

  return (
    <div className={`chartFrame chartFrameTall ${compact ? 'ginglesChartCompact' : ''}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={compact ? { top: 8, right: 8, left: 0, bottom: 6 } : { top: 12, right: 22, left: 4, bottom: 12 }}>
          <CartesianGrid stroke="#d4d4d8" strokeDasharray="2 2" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 1]}
            tickFormatter={(value) => pct(value, 0)}
            tick={{ fontSize: compact ? 10 : 11 }}
            label={compact ? undefined : { value: `Percent ${payload.selectedGroup}`, position: 'insideBottom', offset: -6 }}
          />
          <YAxis
            type="number"
            domain={[0, 1]}
            tickFormatter={(value) => pct(value, 0)}
            tick={{ fontSize: compact ? 10 : 11 }}
            label={compact ? undefined : { value: 'Vote Share', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign={compact ? 'top' : 'middle'} align={compact ? 'center' : 'right'} layout={compact ? 'horizontal' : 'vertical'} wrapperStyle={compact ? { fontSize: '10px', paddingBottom: '6px' } : { fontSize: '11px', paddingLeft: '12px' }} />
          <Scatter name="Democratic precinct points" data={demPoints} dataKey="y" fill="#3b82f6" fillOpacity={0.24} shape={compact ? 'circle' : undefined} />
          <Scatter name="Republican precinct points" data={repPoints} dataKey="y" fill="#ef4444" fillOpacity={0.22} shape={compact ? 'circle' : undefined} />
          {curves.map((curve) => (
            <Line
              key={curve.key}
              data={curveData}
              type="monotone"
              dataKey={curve.key}
              name={curve.label}
              stroke={curve.party === 'DEM' ? '#2563eb' : '#dc2626'}
              strokeWidth={2.2}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
