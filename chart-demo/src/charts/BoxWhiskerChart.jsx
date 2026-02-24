import { ResponsiveContainer } from 'recharts';
import { pct } from '../utils/format.js';

function BoxWhiskerSvg({ payload, width, height }) {
  const margin = { top: 20, right: 18, bottom: 40, left: 48 };
  const innerW = Math.max(10, width - margin.left - margin.right);
  const innerH = Math.max(10, height - margin.top - margin.bottom);
  const rows = payload.rankSummaries;
  const maxY = 1;
  const minY = 0;
  const xStep = innerW / rows.length;
  const boxW = Math.min(36, xStep * 0.55);
  const y = (v) => margin.top + (maxY - v) * (innerH / (maxY - minY));

  return (
    <svg width={width} height={height} role="img" aria-label="Box and whisker chart">
      <rect x="0" y="0" width={width} height={height} fill="white" />
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
        <g key={tick}>
          <line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} stroke="#e2e8f0" />
          <text x={12} y={y(tick) + 4} fontSize="11" fill="#334155">{pct(tick, 0)}</text>
        </g>
      ))}
      <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="#334155" />
      <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="#334155" />
      {rows.map((r, idx) => {
        const cx = margin.left + xStep * idx + xStep / 2;
        return (
          <g key={r.districtRank}>
            <line x1={cx} x2={cx} y1={y(r.min)} y2={y(r.max)} stroke="#475569" strokeWidth="1.3" />
            <line x1={cx - 8} x2={cx + 8} y1={y(r.min)} y2={y(r.min)} stroke="#475569" />
            <line x1={cx - 8} x2={cx + 8} y1={y(r.max)} y2={y(r.max)} stroke="#475569" />
            <rect x={cx - boxW / 2} y={y(r.q3)} width={boxW} height={Math.max(1, y(r.q1) - y(r.q3))} fill="#93c5fd" stroke="#1d4ed8" opacity="0.75" />
            <line x1={cx - boxW / 2} x2={cx + boxW / 2} y1={y(r.median)} y2={y(r.median)} stroke="#1e293b" strokeWidth="2" />
            <circle cx={cx} cy={y(r.enactedValue)} r="4" fill="#dc2626" />
            {r.proposedValue != null ? <circle cx={cx} cy={y(r.proposedValue)} r="4" fill="#059669" /> : null}
            <text x={cx} y={height - margin.bottom + 16} fontSize="11" textAnchor="middle" fill="#334155">{r.districtRank}</text>
          </g>
        );
      })}
      <text x={width / 2} y={height - 8} textAnchor="middle" fontSize="12" fill="#334155">District rank (sorted by selected metric)</text>
      <text x={16} y={height / 2} transform={`rotate(-90 16 ${height / 2})`} textAnchor="middle" fontSize="12" fill="#334155">Share</text>
    </svg>
  );
}

export default function BoxWhiskerChart({ payload }) {
  return (
    <div>
      <div className="meta-inline">
        <span>State: {payload.state}</span>
        <span>Districts: {payload.totalDistricts}</span>
        <span>Metric: {payload.metricLabel}</span>
        <span>Group: {payload.selectedGroup}</span>
      </div>
      <div className="legend-inline">
        <span><i className="legend-swatch swatch-box" /> Ensemble IQR box + whiskers</span>
        <span><i className="legend-swatch swatch-enacted" /> Enacted plan dot</span>
        <span><i className="legend-swatch swatch-proposed" /> Proposed plan dot</span>
      </div>
      <div style={{ width: '100%', height: 420 }}>
        <ResponsiveContainer>
          {({ width, height }) => <BoxWhiskerSvg payload={payload} width={width} height={height} />}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
