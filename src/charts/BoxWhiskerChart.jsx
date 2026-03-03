import '../../styles/chart-integration.css';
import { pct } from '../utils/chartFormat.js';

function BoxWhiskerSvg({ payload }) {
  const width = 720;
  const height = 360;
  const margin = { top: 16, right: 18, bottom: 36, left: 44 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const rows = payload.rankSummaries;
  const xStep = innerWidth / rows.length;
  const boxWidth = Math.min(36, xStep * 0.55);
  const y = (value) => margin.top + (1 - value) * innerHeight;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" role="img" aria-label="Box and whisker chart">
      <rect width={width} height={height} fill="white" />
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
        <g key={tick}>
          <line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} stroke="#e2e8f0" />
          <text x={10} y={y(tick) + 4} fontSize="10" fill="#334155">{pct(tick, 0)}</text>
        </g>
      ))}
      <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="#334155" />
      <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="#334155" />
      {rows.map((row, index) => {
        const centerX = margin.left + xStep * index + xStep / 2;
        return (
          <g key={row.districtRank}>
            <line x1={centerX} x2={centerX} y1={y(row.min)} y2={y(row.max)} stroke="#475569" strokeWidth="1.1" />
            <line x1={centerX - 7} x2={centerX + 7} y1={y(row.min)} y2={y(row.min)} stroke="#475569" />
            <line x1={centerX - 7} x2={centerX + 7} y1={y(row.max)} y2={y(row.max)} stroke="#475569" />
            <rect
              x={centerX - boxWidth / 2}
              y={y(row.q3)}
              width={boxWidth}
              height={Math.max(1, y(row.q1) - y(row.q3))}
              fill="#bfdbfe"
              stroke="#1d4ed8"
              opacity="0.85"
            />
            <line x1={centerX - boxWidth / 2} x2={centerX + boxWidth / 2} y1={y(row.median)} y2={y(row.median)} stroke="#1f2937" strokeWidth="1.8" />
            <circle cx={centerX} cy={y(row.enactedValue)} r="4" fill="#dc2626" />
            {row.proposedValue != null ? <circle cx={centerX} cy={y(row.proposedValue)} r="4" fill="#059669" /> : null}
            <text x={centerX} y={height - margin.bottom + 15} fontSize="10" textAnchor="middle" fill="#334155">{row.districtRank}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function BoxWhiskerChart({ payload }) {
  return (
    <div className="chartPanel">
      <h3 className="chartPanelTitle">{payload.metricLabel}</h3>
      <div className="chartLegend">
        <span><i className="chartLegendSwatch chartLegendBox" /> Ensemble distribution</span>
        <span><i className="chartLegendSwatch chartLegendEnacted" /> Enacted plan</span>
        <span><i className="chartLegendSwatch chartLegendProposed" /> Proposed plan</span>
      </div>
      <div className="chartFrame chartFrameBox">
        <BoxWhiskerSvg payload={payload} />
      </div>
    </div>
  );
}
