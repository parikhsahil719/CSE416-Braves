import React, { useEffect } from "react";
import "../../styles/simulation.css";
import { useParams } from "react-router-dom";
import { topologyToFeatureCollection } from "../utils/topology.js";
import { toStateCode, toGroupKey, defaultGroup, groupOptionsForState } from "../utils/stateUtils.js";
import { useDistrictTopology, useEnsembleSplits, useBoxWhisker, useVraImpact, useMeBoxWhisker, useMeHistogram } from "../queries/stateQueries.js";
import DistrictMap from "./DistrictMap";
import MinorityHeatMap from "./MinorityHeatMap";
import BoxWhiskerChart from "../charts/BoxWhiskerChart.jsx";
import MinoritySelector from "./MinoritySelector.jsx";
import { pct } from "../utils/chartFormat.js";
import { ResponsiveContainer, BarChart, Bar as RechartsBar, XAxis, YAxis, CartesianGrid, Tooltip, ErrorBar, ComposedChart, Scatter, Legend, Dot } from "recharts";

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
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={toChartData(series.raceBlind)} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="splitLabel" tick={{ fontSize: 12 }} />
          <YAxis domain={domain} tick={{ fontSize: 12 }} /><Tooltip formatter={v => [`${v} plans`, "Frequency"]} />
          <RechartsBar dataKey="frequency" fill="#60a5fa" name="Plans" />
        </BarChart>
      </ResponsiveContainer>
      <div className="sim-chartSubtitle" style={{ marginTop: "0.75rem" }}>VRA-Constrained</div>
      <ResponsiveContainer width="100%" height={230}>
        <BarChart data={toChartData(series.vraConstrained)} margin={margin}>
          <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="splitLabel" tick={{ fontSize: 12 }} />
          <YAxis domain={domain} tick={{ fontSize: 12 }} /><Tooltip formatter={v => [`${v} plans`, "Frequency"]} />
          <RechartsBar dataKey="frequency" fill="#f97316" name="Plans" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// GUI-17: Box & Whisker (minority share per district, by ensemble type)
function BoxWhisker({ payload, loading, failed, minority, subtitle }) {
  if (loading) return <div className="sim_placeholder">Loading box & whisker chart...</div>;
  if (failed || !payload) return <div className="sim_placeholder">No box & whisker data available for {minority}.</div>;
  const data = payload.rankSummaries;

  function boxDataKey(entry) {
    return [entry.q1, entry.q3];
  }

  function whiskerDataKey(entry) {
    return [entry.q3 - entry.min, entry.max - entry.q3];
  }

  function ScatterDot({cx, cy, color}) {
    return (<Dot cx={cx} cy={cy} fill={color} r={3} />)
  }

  function MedianLine({ cx, cy, width }) {
    return (<line x1={cx - width / 2} x2={cx + width / 2} y1={cy} y2={cy} stroke={"black"} strokeWidth={1} />);
  }

  function TooltipContent({ active, activeIndex, data }) {
    if (!active) return null;

    return (
      <div style={{ background: '#fafeff', border: 'solid 1px #ccc', padding: '0.5rem' }}>
        <div>Min: {data[activeIndex].min}</div>
        <div>Q1: {data[activeIndex].q1}</div>
        <div>Median: {data[activeIndex].median}</div>
        <div>Q3: {data[activeIndex].q3}</div>
        <div>Max: {data[activeIndex].max}</div>
        <div>Enacted Value: {data[activeIndex].enactedValue}</div>
        <div>Proposed Value: {data[activeIndex].proposedValue}</div>
      </div>
    );
  }

  return (
    <div className="sim-chartStack">
      <div className="sim-chartSubtitle">{subtitle}</div>
      <ResponsiveContainer style={{ width: "100%", height: "100%" }}>
        <ComposedChart data={data} width="100%" height="100%" margin={{bottom: 20}}>
          <XAxis dataKey="districtRank" label={{ value: 'Indexed district', position: "bottom", fontSize : "0.75rem"}} tick={{ fontSize: "0.75rem" }} allowDuplicatedCategory={false}/>
          <YAxis width={30} tick={{ fontSize: "0.75rem" }} ticks={[0, 0.2, 0.4, 0.6, 0.8]}/>
          <CartesianGrid vertical={false} />
          <RechartsBar dataKey={boxDataKey} legendType="none" barSize={20} fill="white" stroke="black" strokeWidth={1} >
            <ErrorBar dataKey={whiskerDataKey} legendType="none" zIndex="-1"/>
          </RechartsBar>
          <Scatter dataKey="median" shape={<MedianLine width={20} />} legendType="none" />
          <Scatter name="Enacted" dataKey="enactedValue" fill="#e11d48" shape={<ScatterDot color="#e11d48" />}/>  {/* fill is for legend, color prop actually colors dot*/}
          <Scatter name="Proposed" dataKey="proposedValue" fill="#ffd000" shape={<ScatterDot color="#ffd000" />} />
          <Tooltip content={<TooltipContent data={data}/>} />
          <Legend align="right" verticalAlign="top" wrapperStyle={{paddingBottom: "16px", fontSize: "0.75rem"}} iconSize={8} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// GUI-20: VRA Impact Table
function VRAImpact({ payload, loading, failed }) {
  const FALLBACK = ["Meet or exceed enacted effective minority districts", "Achieve rough proportionality relative to minority CVAP share", "Satisfy both legal thresholds jointly"];
  const rows = payload?.rows ?? FALLBACK.map(label => ({ metricLabel: label, raceBlindShare: null, vraConstrainedShare: null }));
  const cell = v => loading ? "Loading…" : (failed || v == null) ? "—" : pct(v);
  return (
    <>
      <div className="sim-page-data-label" style={{ fontSize: "1.6rem" }}>VRA Impact Table</div>
      <div id="sim-page-data-container">
        <div className="vra-impact-table-container">
          <table className="vra-impact-table">
            <thead>
              <tr>
                <th className="vra-impact-table-header">VRA Impact Threshold</th>
                <th className="vra-impact-table-header">Race-Blind</th>
                <th className="vra-impact-table-header">VRA-Constrained</th>
              </tr>
            </thead>
            <tbody>{rows.map((row, i) => (
              <tr key={row.metricKey ?? i} className="vra-impact-table-row">
                <td className="vra-impact-table-data">{row.metricLabel}</td>
                <td className="vra-impact-table-data">{cell(row.raceBlindShare)}</td>
                <td className="vra-impact-table-data">{cell(row.vraConstrainedShare)}</td>
              </tr>))}
            </tbody>
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
  const ticks = Array.from({ length: totalDistricts + 1 }, (_, i) => i);

  function rbBoxDataKey(entry) {
    const data = entry.raceBlindSummary;
    return [data.q1, data.q3];
  }

  function rbWhiskerDataKey(entry) {
    const data = entry.raceBlindSummary;
    return [data.q3 - data.min, data.max - data.q3];
  }

  function rbMedianKey(entry) {
    return entry.raceBlindSummary.median;
  }

  function RbMedianLine({ cx, cy, width }) {
    const gap = 2;
    return (<line x1={cx - width - gap} x2={cx - gap} y1={cy} y2={cy} stroke={"black"} strokeWidth={1} />);
  }

  function vraBoxDataKey(entry) {
    const data = entry.vraConstrainedSummary;
    return [data.q1, data.q3];
  }

  function vraWhiskerDataKey(entry) {
    const data = entry.vraConstrainedSummary;
    return [data.q3 - data.min, data.max - data.q3];
  }

  function vraMedianKey(entry) {
    return entry.vraConstrainedSummary.median;
  }

  function VraMedianLine({ cx, cy, width }) {
    const gap = 2;
    return (<line x1={cx + gap} x2={cx + width + gap} y1={cy} y2={cy} stroke={"black"} strokeWidth={1} />);
  }

  function TooltipContent({ active, activeIndex, data }) {
    if (!active) return null;

    const rbData = data[activeIndex].raceBlindSummary;
    const vraData = data[activeIndex].vraConstrainedSummary;

    return (
      <div style={{ background: '#fafeff', border: 'solid 1px #ccc', padding: '0.5rem' }}>
        <div>Min: {rbData.min} | {vraData.min}</div>
        <div>Q1: {rbData.q1} | {vraData.q1}</div>
        <div>Median: {rbData.median} | {vraData.median}</div>
        <div>Q3: {rbData.q3} | {vraData.q3}</div>
        <div>Max: {rbData.max} | {vraData.max}</div>
      </div>
    );
  }

  // function drawBox(s, cx, fill) {
  //   return (
  //     <g key={`${cx}-${fill}`}>
  //       <line x1={cx} x2={cx} y1={ys(s.min)} y2={ys(s.max)} stroke="#475569" strokeWidth={1.35} />
  //       <line x1={cx - 5} x2={cx + 5} y1={ys(s.min)} y2={ys(s.min)} stroke="#475569" />
  //       <line x1={cx - 5} x2={cx + 5} y1={ys(s.max)} y2={ys(s.max)} stroke="#475569" />
  //       <rect x={cx - boxW / 2} y={ys(s.q3)} width={boxW} height={Math.max(1, ys(s.q1) - ys(s.q3))} fill={fill} stroke="#1e3a8a" strokeWidth={1.5} opacity={0.85} />
  //       <line x1={cx - boxW / 2} x2={cx + boxW / 2} y1={ys(s.median)} y2={ys(s.median)} stroke="#1f2937" strokeWidth={2} />
  //     </g>
  //   );
  // }

  return (
    <div className="sim-chartStack">
      <ResponsiveContainer style={{ width: "100%", height: "100%" }}>
        <ComposedChart data={groupSummaries} width="100%" height="100%" margin={{bottom: 20}}>
          <XAxis dataKey="label" label={{ value: 'Racial Group', position: "bottom", fontSize : "0.75rem"}} tick={{ fontSize: "0.75rem" }} allowDuplicatedCategory={false}/>
          <YAxis width={30} tick={{ fontSize: "0.75rem" }} ticks={ticks}/>
          <CartesianGrid vertical={false} />
          <RechartsBar name="Race-Blind Ensemble" dataKey={rbBoxDataKey} barSize={20} fill="#93c5fd" stroke="black" strokeWidth={1} >
            <ErrorBar dataKey={rbWhiskerDataKey} legendType="none" zIndex="-1"/>
          </RechartsBar>
          <Scatter dataKey={rbMedianKey} shape={<RbMedianLine width={20} />} legendType="none" />
          <RechartsBar name="Vra-Constrained Ensemble" dataKey={vraBoxDataKey} barSize={20} fill="#fb923c" stroke="black" strokeWidth={1} >
            <ErrorBar dataKey={vraWhiskerDataKey} legendType="none" zIndex="-1"/>
          </RechartsBar>
          <Scatter dataKey={vraMedianKey} shape={<VraMedianLine width={20} />} legendType="none" />
          <Tooltip content={<TooltipContent data={groupSummaries}/>} />
          <Legend align="right" verticalAlign="top" wrapperStyle={{paddingBottom: "16px", fontSize: "0.75rem"}} iconSize={8} />
        </ComposedChart>
      </ResponsiveContainer>
      {/* <svg viewBox={`0 0 ${W} ${H}`} width="100%" preserveAspectRatio="xMidYMin meet" role="img" aria-label="Minority effectiveness box and whisker chart">
        <rect width={W} height={H} fill="white" />
        {ticks.map(t => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={ys(t)} y2={ys(t)} stroke="#cbd5e1" strokeDasharray="3 3" />
            <text x={M.left - 8} y={ys(t) + 5} fontSize={13} textAnchor="end" fill="#0f172a">{t}</text>
          </g>))}
        <line x1={M.left} x2={M.left} y1={M.top} y2={H - M.bottom} stroke="#475569" strokeWidth={1.2} />
        <line x1={M.left} x2={W - M.right} y1={H - M.bottom} y2={H - M.bottom} stroke="#475569" strokeWidth={1.2} />
        <text x={14} y={M.top + IH / 2} fontSize={13} fontWeight={700} fill="#0f172a" textAnchor="middle" transform={`rotate(-90 14 ${M.top + IH / 2})`}>Effective Districts</text>
        {groupSummaries.map((g, i) => {
          const cx = M.left + slotW * i + slotW / 2;
          return (
            <g key={g.key}>{drawBox(g.raceBlindSummary, cx - boxW * 0.8, "#93c5fd")}{drawBox(g.vraConstrainedSummary, cx + boxW * 0.8, "#fb923c")}
              <text x={cx} y={H - M.bottom + 20} fontSize={13} textAnchor="middle" fill="#0f172a">{g.label}</text>
            </g>);
        })}
        <rect x={M.left + 10} y={8} width={14} height={14} fill="#93c5fd" stroke="#1e3a8a" strokeWidth={1.5} />
        <text x={M.left + 28} y={19} fontSize={12} fill="#0f172a">Race-Blind</text>
        <rect x={M.left + 110} y={8} width={14} height={14} fill="#fb923c" stroke="#1e3a8a" strokeWidth={1.5} />
        <text x={M.left + 128} y={19} fontSize={12} fill="#0f172a">VRA-Constrained</text>
      </svg> */}
    </div>
  );
}

// Single bar shape that draws both series per x-position with dynamic z-ordering.
// height/y come from Recharts for the maxVal key; proportional heights are derived from the data.
function OverlappingBar({ x, y, width, height, raceBlind, vraConstrained, maxVal }) {
  if (!maxVal) return null;
  const bottom = y + height;
  const gH = height * (raceBlind / maxVal);
  const bH = height * (vraConstrained / maxVal);
  const gTop = bottom - gH;
  const bTop = bottom - bH;
  if (gH >= bH) {
    return (
      <g>
        <rect x={x} y={gTop} width={width} height={gH} fill="#5aa75b" fillOpacity={0.55} />
        <rect x={x} y={bTop} width={width} height={bH} fill="#5c6bc0" fillOpacity={0.55} />
      </g>
    );
  }
  return (
    <g>
      <rect x={x} y={bTop} width={width} height={bH} fill="#5c6bc0" fillOpacity={0.55} />
      <rect x={x} y={gTop} width={width} height={gH} fill="#5aa75b" fillOpacity={0.55} />
    </g>
  );
}

function HistogramTooltip({ active, payload, label }) {
  if (!active || !payload?.[0]) return null;
  const { raceBlind, vraConstrained } = payload[0].payload;
  return (
    <div style={{ background: "white", border: "1px solid #ccc", padding: "8px 10px", fontSize: 12 }}>
      <p style={{ margin: "0 0 4px 0", fontWeight: 600 }}>{label} effective districts</p>
      <p style={{ color: "#5aa75b", margin: 0 }}>Non-VRA: {raceBlind} plans</p>
      <p style={{ color: "#5c6bc0", margin: 0 }}>Constrained: statewide score: {vraConstrained} plans</p>
    </div>
  );
}

// GUI-22: Minority Effectiveness Ensemble Histogram
function MinorityEffectivenessHistogram({ payload, loading, failed, group }) {
  if (loading) return <div className="sim_placeholder">Loading minority effectiveness ensemble histogram...</div>;
  if (failed || !payload) return <div className="sim_placeholder">No minority effectiveness ensemble histogram data available.</div>;
  const { series, totalDistricts } = payload;
  const allDistricts = [...new Set([...series.raceBlind.map(d => d.effectiveDistricts), ...series.vraConstrained.map(d => d.effectiveDistricts)])].sort((a, b) => a - b);
  const chartData = allDistricts.map(n => {
    const rb = series.raceBlind.find(d => d.effectiveDistricts === n)?.frequency ?? 0;
    const vc = series.vraConstrained.find(d => d.effectiveDistricts === n)?.frequency ?? 0;
    return { effectiveDistricts: n, raceBlind: rb, vraConstrained: vc, maxVal: Math.max(rb, vc) };
  });
  return (
    <div className="sim-chartStack">
      <div style={{ display: "flex", gap: "1.25rem", marginBottom: 4, paddingLeft: "3rem", fontSize: 13 }}>
        <span><span style={{ display: "inline-block", width: 14, height: 14, background: "#5c6bc0", opacity: 0.55, marginRight: 5, verticalAlign: "middle" }} />Constrained: statewide score</span>
        <span><span style={{ display: "inline-block", width: 14, height: 14, background: "#5aa75b", opacity: 0.55, marginRight: 5, verticalAlign: "middle" }} />Non-VRA</span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 40 }} barCategoryGap={0}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="effectiveDistricts" ticks={Array.from({ length: totalDistricts + 1 }, (_, i) => i)} label={{ value: `Number of Districts with ${group} effectiveness > 60%`, position: "insideBottom", offset: -20, fontSize: 12 }} tick={{ fontSize: 12 }} />
          <YAxis label={{ value: "Plans", angle: -90, position: "insideLeft", fontSize: 13 }} tick={{ fontSize: 12 }} />
          <Tooltip content={<HistogramTooltip />} />
          <RechartsBar dataKey="maxVal" shape={OverlappingBar} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Simulation({ currMap, currMinority, switchMinority, currSimData, switchSimData }) {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);
  const groupKey = toGroupKey(currMinority) ?? defaultGroup(stateCode);

  const topo = useDistrictTopology(stateCode);
  const splits = useEnsembleSplits(stateCode);
  const bwRace = useBoxWhisker(stateCode, groupKey, 'race_blind');
  const bwVra = useBoxWhisker(stateCode, groupKey, 'vra_constrained');
  const vraImpact = useVraImpact(stateCode, groupKey);
  const meBw = useMeBoxWhisker(stateCode);
  const meHist = useMeHistogram(stateCode, groupKey);

  useEffect(() => {
    if (!groupOptionsForState(stateName).includes(currMinority))
      switchMinority(defaultGroup(stateCode));
  }, []);

  useEffect(() => () => switchSimData(''), []);

  const mapData = topo.data ? topologyToFeatureCollection(topo.data, "districts") : null;

  function renderPanel() {
    if (currSimData === "Ensemble Splits")
      return <EnsembleSplits payload={splits.data} loading={splits.isLoading} failed={splits.isError} />;
    if (currSimData === "Box Whisker")
      return (<>
        <MinoritySelector stateName={stateName} currMinority={currMinority} switchMinority={switchMinority} />
        <div className="box-whisker-container">
          <BoxWhisker payload={bwRace.data} loading={bwRace.isLoading} failed={bwRace.isError} minority={currMinority} subtitle="Race-Blind Ensemble" />
          <BoxWhisker payload={bwVra.data} loading={bwVra.isLoading} failed={bwVra.isError} minority={currMinority} subtitle="VRA-Constrained Ensemble" />
        </div>
      </>);
    if (currSimData === "Minority Effectiveness Box Whisker")
      return (<>
        <MinorityEffectivenessBoxWhisker payload={meBw.data} loading={meBw.isLoading} failed={meBw.isError} />
        <VRAImpact payload={vraImpact.data} loading={vraImpact.isLoading} failed={vraImpact.isError} />
      </>);
    if (currSimData === "Minority Effectiveness Histogram")
      return (<>
        <MinoritySelector stateName={stateName} currMinority={currMinority} switchMinority={switchMinority} />
        <div>
          <MinorityEffectivenessHistogram payload={meHist.data} loading={meHist.isLoading} failed={meHist.isError} group={currMinority} />
          <VRAImpact payload={vraImpact.data} loading={vraImpact.isLoading} failed={vraImpact.isError} />
        </div>
      </>);
    return null;
  }

  return (
    <span id="sim-page-main">
      <div id="sim-page-map-container">
        <div className="sim-page-map-label">{currMap === 'Precinct Heat Map' ? `${currMap} of ${currMinority} Population in ${stateName}` : `Current Congressional Districts of ${stateName}`}</div>
        {currMap === "District Map" ? <DistrictMap stateName={stateName} data={mapData} /> : <MinorityHeatMap currMinority={currMinority} switchMinority={switchMinority} />}
        {topo.isLoading && <div className="sim-page-status-message">Loading {stateName} {currMap}...</div>}
        {topo.isError && <div className="sim-page-status-message">Unable to load {stateName} {currMap}</div>}
      </div>
      <div id="sim-page-data-main-container">
        <div className="sim-page-data-label">{currSimData}</div>
        {renderPanel()}
      </div>
    </span>
  );
}
