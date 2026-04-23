import React, { useEffect } from "react";
import "../../styles/simulation.css";
import { useParams } from "react-router-dom";
import { topologyToFeatureCollection } from "../utils/topology.js";
import { toStateCode, toGroupKey, defaultGroup, groupOptionsForState } from "../utils/stateUtils.js";
import { useDistrictTopology, useEnsembleSplits, useBoxWhisker, useVraImpact, useMeBoxWhisker, useMeHistogram } from "../queries/stateQueries.js";
import DistrictMap from "./DistrictMap";
import MinorityHeatMap from "./MinorityHeatMap";
import BoxWhiskerChart from "../charts/BoxWhiskerChart.jsx";
import { pct } from "../utils/chartFormat.js";
import { ResponsiveContainer, BarChart, Bar as RechartsBar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

// GUI-16: Ensemble Splits — paired bar charts on the same y-axis domain
function EnsembleSplits({ payload, loading, failed }) {
  if (loading) return <div className="sim_placeholder">Loading ensemble splits...</div>;
  if (failed || !payload) return <div className="sim_placeholder">No ensemble splits data available.</div>;
  const { series } = payload;
  const allLabels = [...new Set([...series.raceBlind.map(d => d.splitLabel), ...series.vraConstrained.map(d => d.splitLabel)])];
  const yMax = Math.max(...series.raceBlind.map(d => d.frequency), ...series.vraConstrained.map(d => d.frequency));
  const domain = [0, yMax + Math.ceil(yMax * 0.1) + 1];
  const toChartData = (src) => allLabels.map(label => ({ splitLabel: label, frequency: src.find(d => d.splitLabel === label)?.frequency ?? 0 }));
  const margin = { top: 5, right: 10, left: 0, bottom: 5 };
  return (
    <div className="sim-chartStack">
      <div className="sim-chartSubtitle">Race-Blind</div>
      <ResponsiveContainer width="100%" height={180}><BarChart data={toChartData(series.raceBlind)} margin={margin}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="splitLabel" tick={{ fontSize: 12 }} /><YAxis domain={domain} tick={{ fontSize: 12 }} /><Tooltip formatter={v => [`${v} plans`, "Frequency"]} /><RechartsBar dataKey="frequency" fill="#60a5fa" name="Plans" /></BarChart></ResponsiveContainer>
      <div className="sim-chartSubtitle" style={{ marginTop: "0.75rem" }}>VRA-Constrained</div>
      <ResponsiveContainer width="100%" height={180}><BarChart data={toChartData(series.vraConstrained)} margin={margin}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="splitLabel" tick={{ fontSize: 12 }} /><YAxis domain={domain} tick={{ fontSize: 12 }} /><Tooltip formatter={v => [`${v} plans`, "Frequency"]} /><RechartsBar dataKey="frequency" fill="#f97316" name="Plans" /></BarChart></ResponsiveContainer>
    </div>
  );
}

// GUI-17: Box & Whisker (minority share per district, by ensemble type)
function BoxWhisker({ payload, loading, failed, minority, subtitle }) {
  if (loading) return <div className="sim_placeholder">Loading box & whisker chart...</div>;
  if (failed || !payload) return <div className="sim_placeholder">No box & whisker data available for {minority}.</div>;
  return <div className="sim-chartStack"><div className="sim-chartSubtitle">{subtitle}</div><BoxWhiskerChart payload={payload} showHeader={false} /></div>;
}

// GUI-20: VRA Impact Table
function VRAImpact({ payload, loading, failed }) {
  const FALLBACK = ["Meet or exceed enacted effective minority districts", "Achieve rough proportionality relative to minority CVAP share", "Satisfy both legal thresholds jointly"];
  const rows = payload?.rows ?? FALLBACK.map(label => ({ metricLabel: label, raceBlindShare: null, vraConstrainedShare: null }));
  const cell = v => loading ? "Loading…" : (failed || v == null) ? "—" : pct(v);
  return (
    <>
      <div className="sim-page-data-label">VRA Impact Table</div>
      <div id="sim-page-data-container">
        <div className="vra-impact-table-container">
          <table className="vra-impact-table">
            <thead><tr><th className="vra-impact-table-header">VRA Impact Threshold</th><th className="vra-impact-table-header">Race-Blind</th><th className="vra-impact-table-header">VRA-Constrained</th></tr></thead>
            <tbody>{rows.map((row, i) => (<tr key={row.metricKey ?? i} className="vra-impact-table-row"><td className="vra-impact-table-data">{row.metricLabel}</td><td className="vra-impact-table-data">{cell(row.raceBlindShare)}</td><td className="vra-impact-table-data">{cell(row.vraConstrainedShare)}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// GUI-21: Minority Effectiveness Box & Whisker — paired SVG boxes per feasible group
function MinorityEffectivenessBoxWhisker({ payload, loading, failed }) {
  if (loading) return <div className="sim_placeholder">Loading minority effectiveness box & whisker...</div>;
  if (failed || !payload) return <div className="sim_placeholder">No minority effectiveness box & whisker data available.</div>;
  const { groupSummaries, totalDistricts } = payload;
  const W = 700, H = 320, M = { top: 36, right: 20, bottom: 54, left: 50 };
  const IW = W - M.left - M.right, IH = H - M.top - M.bottom;
  const slotW = IW / groupSummaries.length;
  const boxW  = Math.min(28, slotW * 0.28);
  const ys    = v => M.top + IH - (v / totalDistricts) * IH;
  const ticks = Array.from({ length: totalDistricts + 1 }, (_, i) => i);

  function drawBox(s, cx, fill) {
    return (
      <g key={`${cx}-${fill}`}>
        <line x1={cx} x2={cx} y1={ys(s.min)} y2={ys(s.max)} stroke="#475569" strokeWidth={1.35} />
        <line x1={cx - 5} x2={cx + 5} y1={ys(s.min)} y2={ys(s.min)} stroke="#475569" />
        <line x1={cx - 5} x2={cx + 5} y1={ys(s.max)} y2={ys(s.max)} stroke="#475569" />
        <rect x={cx - boxW / 2} y={ys(s.q3)} width={boxW} height={Math.max(1, ys(s.q1) - ys(s.q3))} fill={fill} stroke="#1e3a8a" strokeWidth={1.5} opacity={0.85} />
        <line x1={cx - boxW / 2} x2={cx + boxW / 2} y1={ys(s.median)} y2={ys(s.median)} stroke="#1f2937" strokeWidth={2} />
      </g>
    );
  }

  return (
    <div className="sim-chartStack">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMin meet" role="img" aria-label="Minority effectiveness box and whisker chart">
        <rect width={W} height={H} fill="white" />
        {ticks.map(t => (<g key={t}><line x1={M.left} x2={W - M.right} y1={ys(t)} y2={ys(t)} stroke="#cbd5e1" strokeDasharray="3 3" /><text x={M.left - 8} y={ys(t) + 5} fontSize={13} textAnchor="end" fill="#0f172a">{t}</text></g>))}
        <line x1={M.left} x2={M.left} y1={M.top} y2={H - M.bottom} stroke="#475569" strokeWidth={1.2} />
        <line x1={M.left} x2={W - M.right} y1={H - M.bottom} y2={H - M.bottom} stroke="#475569" strokeWidth={1.2} />
        <text x={14} y={M.top + IH / 2} fontSize={13} fontWeight={700} fill="#0f172a" textAnchor="middle" transform={`rotate(-90 14 ${M.top + IH / 2})`}>Effective Districts</text>
        {groupSummaries.map((g, i) => { const cx = M.left + slotW * i + slotW / 2; return (<g key={g.key}>{drawBox(g.raceBlindSummary, cx - boxW * 0.8, "#93c5fd")}{drawBox(g.vraConstrainedSummary, cx + boxW * 0.8, "#fb923c")}<text x={cx} y={H - M.bottom + 20} fontSize={13} textAnchor="middle" fill="#0f172a">{g.label}</text></g>); })}
        <rect x={M.left + 10} y={8} width={14} height={14} fill="#93c5fd" stroke="#1e3a8a" strokeWidth={1.5} /><text x={M.left + 28} y={19} fontSize={12} fill="#0f172a">Race-Blind</text>
        <rect x={M.left + 110} y={8} width={14} height={14} fill="#fb923c" stroke="#1e3a8a" strokeWidth={1.5} /><text x={M.left + 128} y={19} fontSize={12} fill="#0f172a">VRA-Constrained</text>
      </svg>
    </div>
  );
}

// GUI-22: Minority Effectiveness Ensemble Histogram
function MinorityEffectivenessHistogram({ payload, loading, failed }) {
  if (loading) return <div className="sim_placeholder">Loading minority effectiveness ensemble histogram...</div>;
  if (failed || !payload) return <div className="sim_placeholder">No minority effectiveness ensemble histogram data available.</div>;
  const { series } = payload;
  const allDistricts = [...new Set([...series.raceBlind.map(d => d.effectiveDistricts), ...series.vraConstrained.map(d => d.effectiveDistricts)])].sort((a, b) => a - b);
  const chartData = allDistricts.map(n => ({ effectiveDistricts: n, raceBlind: series.raceBlind.find(d => d.effectiveDistricts === n)?.frequency ?? 0, vraConstrained: series.vraConstrained.find(d => d.effectiveDistricts === n)?.frequency ?? 0 }));
  return (
    <div className="sim-chartStack">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="effectiveDistricts" label={{ value: "Effective Districts", position: "insideBottom", offset: -15, fontSize: 13 }} tick={{ fontSize: 12 }} />
          <YAxis label={{ value: "Plans", angle: -90, position: "insideLeft", fontSize: 13 }} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v, name) => [`${v} plans`, name]} />
          <Legend verticalAlign="top" />
          <RechartsBar dataKey="raceBlind" name="Race-Blind" fill="#60a5fa" opacity={0.85} />
          <RechartsBar dataKey="vraConstrained" name="VRA-Constrained" fill="#f97316" opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MinoritySelector({ stateName, currMinority, switchMinority }) {
  const options = groupOptionsForState(stateName).map(m => <option key={m} value={m}>{m}</option>);
  return (
    <div className="minority-selector-container">
      <label htmlFor="minoritySelector" style={{ fontWeight: "bolder" }}>Select a racial group: </label>
      <select name="minoritySelector" value={currMinority} onChange={e => switchMinority(e.target.value)}>{options}</select>
    </div>
  );
}

export default function Simulation({ currMap, currMinority, switchMinority, currSimData, switchSimData }) {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);
  const groupKey  = toGroupKey(currMinority) ?? defaultGroup(stateCode);

  const topo     = useDistrictTopology(stateCode);
  const splits   = useEnsembleSplits(stateCode);
  const bwRace   = useBoxWhisker(stateCode, groupKey, 'race_blind');
  const bwVra    = useBoxWhisker(stateCode, groupKey, 'vra_constrained');
  const vraImpact= useVraImpact(stateCode, groupKey);
  const meBw     = useMeBoxWhisker(stateCode);
  const meHist   = useMeHistogram(stateCode, groupKey);

  useEffect(() => () => switchSimData(''), []);

  const mapData = topo.data ? topologyToFeatureCollection(topo.data, "districts") : null;

  function renderPanel() {
    if (currSimData === "Ensemble Splits") return <EnsembleSplits payload={splits.data} loading={splits.isLoading} failed={splits.isError} />;
    if (currSimData === "Box Whisker") return (<><MinoritySelector stateName={stateName} currMinority={currMinority} switchMinority={switchMinority} /><BoxWhisker payload={bwRace.data} loading={bwRace.isLoading} failed={bwRace.isError} minority={currMinority} subtitle="Race-Blind Ensemble" /><BoxWhisker payload={bwVra.data} loading={bwVra.isLoading} failed={bwVra.isError} minority={currMinority} subtitle="VRA-Constrained Ensemble" /></>);
    if (currSimData === "Minority Effectiveness Box Whisker") return (<><MinorityEffectivenessBoxWhisker payload={meBw.data} loading={meBw.isLoading} failed={meBw.isError} /><VRAImpact payload={vraImpact.data} loading={vraImpact.isLoading} failed={vraImpact.isError} /></>);
    if (currSimData === "Minority Effectiveness Histogram") return (<><MinoritySelector stateName={stateName} currMinority={currMinority} switchMinority={switchMinority} /><MinorityEffectivenessHistogram payload={meHist.data} loading={meHist.isLoading} failed={meHist.isError} /><VRAImpact payload={vraImpact.data} loading={vraImpact.isLoading} failed={vraImpact.isError} /></>);
    return null;
  }

  return (
    <span id="sim-page-main">
      <div id="sim-page-map-container">
        <div className="sim-page-map-label">{currMap === 'Precinct Heat Map' ? `${currMap} of ${currMinority} Population in ${stateName}` : `Map of Current Congressional Districts of ${stateName}`}</div>
        {currMap === "District Map" ? <DistrictMap stateName={stateName} data={mapData} /> : <MinorityHeatMap currMinority={currMinority} switchMinority={switchMinority} />}
        {topo.isLoading && <div className="sim-page-status-message">Loading {stateName} {currMap}...</div>}
        {topo.isError   && <div className="sim-page-status-message">Unable to load {stateName} {currMap}</div>}
      </div>
      <div id="sim-page-data-main-container">
        <div className="sim-page-data-label">{currSimData}</div>
        {renderPanel()}
      </div>
    </span>
  );
}
