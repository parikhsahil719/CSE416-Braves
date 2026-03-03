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

function flattenSeries(series) {
  const rows = new Map();
  for (const entry of series) {
    for (const point of entry.points ?? []) {
      const key = point.xSupportShare.toFixed(4);
      if (!rows.has(key)) rows.set(key, { xSupportShare: point.xSupportShare });
      rows.get(key)[entry.key] = point.density;
    }
  }
  return [...rows.values()].sort((a, b) => a.xSupportShare - b.xSupportShare);
}

export default function EiSupportChart({ payload }) {
  const data = flattenSeries(payload.series);
  const colors = [
    { stroke: '#2a9d8f', fill: '#2a9d8f66' },
    { stroke: '#d48b19', fill: '#d48b194d' },
    { stroke: '#264653', fill: '#2646534d' },
  ];

  return (
    <div className="chartPanel">
      <h3 className="chartPanelTitle">Support for {payload.selectedCandidate}</h3>
      <div className="chartFrame">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 18, left: 0, bottom: 8 }}>
            <CartesianGrid stroke="#d4d4d8" strokeDasharray="2 2" />
            <XAxis dataKey="xSupportShare" type="number" domain={[0, 1]} tickFormatter={(value) => pct(value, 0)} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => [Number(value).toFixed(3), 'Density']} labelFormatter={(value) => `Support ${pct(value)}`} />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px' }} />
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
                strokeWidth={1.7}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
