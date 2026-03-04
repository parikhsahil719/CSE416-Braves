import React from 'react';
import '../../styles/chart-integration.css';
import { pct } from '../utils/chartFormat.js';

function BoxWhiskerSvg({ payload }) {
  const width = 780;
  const height = 410;
  const margin = { top: 20, right: 22, bottom: 52, left: 54 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const rows = payload.rankSummaries;
  const xStep = innerWidth / rows.length;
  const boxWidth = Math.min(44, xStep * 0.6);
  const y = (value) => margin.top + (1 - value) * innerHeight;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" role="img" aria-label="Box and whisker chart">
      <rect width={width} height={height} fill="white" />
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
        <g key={tick}>
          <line x1={margin.left} x2={width - margin.right} y1={y(tick)} y2={y(tick)} stroke="#d7dee8" strokeDasharray="3 3" />
          <text x={12} y={y(tick) + 4} fontSize="11" fill="#334155">{pct(tick, 0)}</text>
        </g>
      ))}
      <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="#334155" />
      <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="#334155" />
      <text x={18} y={margin.top - 4} fontSize="11" fill="#334155">Share</text>
      <text x={width / 2} y={height - 14} fontSize="11" textAnchor="middle" fill="#334155">District rank</text>
      {rows.map((row, index) => {
        const centerX = margin.left + xStep * index + xStep / 2;
        return (
          <g key={row.districtRank}>
            <line x1={centerX} x2={centerX} y1={y(row.min)} y2={y(row.max)} stroke="#475569" strokeWidth="1.2" />
            <line x1={centerX - 7} x2={centerX + 7} y1={y(row.min)} y2={y(row.min)} stroke="#475569" />
            <line x1={centerX - 7} x2={centerX + 7} y1={y(row.max)} y2={y(row.max)} stroke="#475569" />
            <rect
              x={centerX - boxWidth / 2}
              y={y(row.q3)}
              width={boxWidth}
              height={Math.max(1, y(row.q1) - y(row.q3))}
              fill="#bfdbfe"
              stroke="#1d4ed8"
              opacity="0.88"
            />
            <line x1={centerX - boxWidth / 2} x2={centerX + boxWidth / 2} y1={y(row.median)} y2={y(row.median)} stroke="#1f2937" strokeWidth="1.8" />
            <circle cx={centerX} cy={y(row.enactedValue)} r="4" fill="#dc2626" />
            {row.proposedValue != null ? <circle cx={centerX} cy={y(row.proposedValue)} r="4" fill="#059669" /> : null}
            <text x={centerX} y={height - margin.bottom + 18} fontSize="11" textAnchor="middle" fill="#334155">{row.districtRank}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function BoxWhiskerChart({ payload, title, subtitle }) {
  return (
    <div className="chartPanel">
      <h3 className="chartPanelTitle">{title ?? payload.metricLabel}</h3>
      {subtitle ? <div className="chartPanelMeta"><span>{subtitle}</span></div> : null}
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
