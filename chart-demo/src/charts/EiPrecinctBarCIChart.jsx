import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { pct } from '../utils/format.js';

function BarWithCI(props) {
  const { x, y, width, height, fill, payload } = props;
  const toY = payload?.__scale?.toY;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx="3" ry="3" />
      {toY ? (
        (() => {
          const cx = x + width / 2;
          const yLow = toY(payload.ciLow);
          const yHigh = toY(payload.ciHigh);
          return (
            <g>
              <line x1={cx} x2={cx} y1={yLow} y2={yHigh} stroke="#1f2937" strokeWidth="1.5" />
              <line x1={cx - 7} x2={cx + 7} y1={yLow} y2={yLow} stroke="#1f2937" />
              <line x1={cx - 7} x2={cx + 7} y1={yHigh} y2={yHigh} stroke="#1f2937" />
            </g>
          );
        })()
      ) : null}
    </g>
  );
}

export default function EiPrecinctBarCIChart({ payload }) {
  const H = 360;
  const margin = { top: 10, right: 20, left: 8, bottom: 25 };
  const innerTop = margin.top;
  const innerBottom = H - margin.bottom;
  const toY = (value) => innerTop + (1 - value) * (innerBottom - innerTop);
  const data = payload.categories.map((d) => ({ ...d, __scale: { toY } }));

  return (
    <div>
      <div className="meta-inline"><span>State: {payload.state}</span><span>Candidate: {payload.selectedCandidate}</span></div>
      <ResponsiveContainer width="100%" height={H}>
        <BarChart data={data} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" interval={0} angle={-15} textAnchor="end" height={40} />
          <YAxis domain={[0, 1]} tickFormatter={pct} />
          <Tooltip formatter={(v) => [pct(v), 'Peak']} />
          <Bar dataKey="peak" fill="#60a5fa" shape={<BarWithCI />} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
