import React, { useState, useEffect, useMemo } from "react";
import "../../styles/simulation.css";
import { useParams } from "react-router-dom";
import { topologyToFeatureCollection } from "../utils/topology.js";
import { toStateCode, toGroupKey, defaultGroup, groupOptionsForState } from "../utils/stateUtils.js";
import { useDistrictTopology, useEnsembleSplits, useBoxWhisker, useVraImpact, useMeBoxWhiskerRb, useMeBoxWhiskerVra, useMeHistogram, useMajorityMinorityBar } from "../queries/stateQueries.js";
import DistrictMap from "./DistrictMap";
import MinorityHeatMap from "./MinorityHeatMap";
import BoxWhiskerChart from "../charts/BoxWhiskerChart.jsx";
import MinoritySelector from "./MinoritySelector.jsx";
import EnsembleSelector from "./EnsembleSelector.jsx";
import { pct } from "../utils/chartFormat.js";
import { ResponsiveContainer, BarChart, Bar as RechartsBar, XAxis, YAxis, CartesianGrid, Tooltip, ErrorBar, ComposedChart, Scatter, Legend, Dot } from "recharts";

// GUI-16: Ensemble Splits — paired bar charts on the same y-axis domain
function EnsembleSplits({ payload, loading, failed }) {
  if (loading) return <div className="sim-placeholder">Loading ensemble splits...</div>;
  if (failed || !payload) return <div className="sim-placeholder">No ensemble splits data available.</div>;
  const { series } = payload;
  const allLabels = [...new Set([...series.raceBlind.map(d => d.splitLabel), ...series.vraConstrained.map(d => d.splitLabel)])];
  const yMax = Math.max(...series.raceBlind.map(d => d.frequency), ...series.vraConstrained.map(d => d.frequency));
  const domain = [0, yMax + Math.ceil(yMax * 0.1) + 1];
  const toChartData = (src) => allLabels.map(label => ({ splitLabel: label, frequency: src.find(d => d.splitLabel === label)?.frequency ?? 0 }));
  const margin = { top: 5, right: 10, left: 4, bottom: 15 };
  return (
    <div className="sim-chartStack">
      <div id="sim-page-data-container">
        <div className="sim-chartSubtitle">Race-Blind</div>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={toChartData(series.raceBlind)} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="splitLabel" tick={{ fontSize: 12 }} label={{ value:"Republican wins/Democratic wins", fontSize : "0.8rem", position: "bottom", dy: -4 }} />
            <YAxis domain={domain} tick={{ fontSize: 12 }} label={{ value:"Number of Plans", fontSize : "0.8rem", angle: -90, position: "insideLeft", dx: -4, dy: 35 }} />
            <Tooltip formatter={v => [`${v} plans`, "Frequency"]} />
            <RechartsBar dataKey="frequency" fill="#1b9e77" name="Plans" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <br />
      <div id="sim-page-data-container">
        <div className="sim-chartSubtitle">VRA-Constrained</div>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={toChartData(series.vraConstrained)} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="splitLabel" tick={{ fontSize: 12 }} label={{ value:"Republican wins/Democratic wins", fontSize : "0.8rem", position: "bottom", dy: -4 }} />
            <YAxis domain={domain} tick={{ fontSize: 12 }} label={{ value:"Number of Plans", fontSize : "0.8rem", angle: -90, position: "insideLeft", dx: -4, dy: 35 }} />
            <Tooltip formatter={v => [`${v} plans`, "Frequency"]} />
            <RechartsBar dataKey="frequency" fill="#d95f02" name="Plans" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// GUI-17: Box & Whisker (minority share per district, by ensemble type)
function BoxWhisker({ payload, loading, failed, minority, subtitle, ensembleType, currEnsemble, switchEnsemble }) {
  if (loading) return <div className="sim-placeholder">Loading box & whisker chart...</div>;
  if (failed || !payload) return <div className="sim-placeholder">No box & whisker data available for {minority}.</div>;
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
    <div id="sim-page-data-container">
      <div className="sim-chartStack">
        <div className="box-whisker-selector-container">
          <EnsembleSelector ensembleType={ensembleType} currEnsemble={currEnsemble} switchEnsemble={switchEnsemble} maxOptions={4} />
        </div>
        <ResponsiveContainer style={{ width: "100%", height: "100%" }}>
          <ComposedChart data={data} width="100%" height="100%" margin={{left: -30, bottom: 20}}>
            <XAxis dataKey="districtRank" label={{ value: 'Indexed district', position: "bottom", fontSize : "0.85rem"}} tick={{ fontSize: "0.75rem" }} allowDuplicatedCategory={false}/>
            <YAxis width={70} label={{ value: "Population Percentage", fontSize : "0.8rem", angle: -90}} tick={{ fontSize: "0.75rem" }} ticks={[0, 0.2, 0.4, 0.6]}/>
            <CartesianGrid vertical={false} />
            <RechartsBar dataKey={boxDataKey} legendType="none" barSize={20} fill="#e8eaec" stroke="black" strokeWidth={1} >
              <ErrorBar dataKey={whiskerDataKey} legendType="none" zIndex="-1"/>
            </RechartsBar>
            <Scatter dataKey="median" shape={<MedianLine width={20} />} legendType="none" />
            <Scatter name="Enacted" dataKey="enactedValue" fill="#e11d48" shape={<ScatterDot color="#e11d48" />}/>  {/* fill is for legend, color prop actually colors dot*/}
            {data[0].proposedValue && <Scatter name="Proposed" dataKey="proposedValue" fill="#ffd000" shape={<ScatterDot color="#ffd000" />} />}
            <Tooltip content={<TooltipContent data={data}/>} />
            <Legend align="right" verticalAlign="top" wrapperStyle={{paddingBottom: "16px", fontSize: "0.75rem"}} iconSize={8} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
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
      {/* <div className="sim-page-data-label" style={{ fontSize: "1.6rem" }}>VRA Impact Table</div> */}
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

function MinorityEffectivenessTabBar({ tab, onSelect }) {
  function cls(name) { return `meDataTab${tab === name ? " meActiveTab" : ""}`; }
  return (
    <span className="meLabelsContainer">
      {["Box and Whisker", "Histogram"].map(name => (
        <div key={name} className={cls(name)} onClick={() => onSelect(name)}>{name}</div>
      ))}
    </span>
  );
}

// GUI-21: Minority Effectiveness Box & Whisker — paired SVG boxes per feasible group
function MinorityEffectivenessBoxWhisker({ payload, loading, failed }) {
  if (loading) return <div className="sim-placeholder">Loading minority effectiveness box & whisker...</div>;
  if (failed || !payload) return <div className="sim-placeholder">No minority effectiveness box & whisker data available.</div>;
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

  return (
    <div id="sim-page-data-container">
      <div className="sim-chartStack">
        <ResponsiveContainer style={{ width: "100%", height: "100%" }}>
          <ComposedChart data={groupSummaries} width="100%" height="100%" margin={{left: -20, bottom: 14}}>
            <XAxis dataKey="label" label={{ value: 'Racial Group', position: "bottom", fontSize : "0.8rem", offset: -2}} tick={{ fontSize: "0.75rem" }} allowDuplicatedCategory={false}/>
            <YAxis width={55} label={{ value: "Number of Minority Effective Districts", fontSize : "0.85rem", angle: -90}} tick={{ fontSize: "0.75rem" }} ticks={ticks}/>
            <CartesianGrid vertical={false} />
            <RechartsBar name="Race-Blind Ensemble" dataKey={rbBoxDataKey} barSize={20} fill="#1b9e77" stroke="black" strokeWidth={1} >
              <ErrorBar dataKey={rbWhiskerDataKey} legendType="none" zIndex="-1"/>
            </RechartsBar>
            <Scatter dataKey={rbMedianKey} shape={<RbMedianLine width={20} />} legendType="none" />
            <RechartsBar name="Vra-Constrained Ensemble" dataKey={vraBoxDataKey} barSize={20} fill="#d95f02" stroke="black" strokeWidth={1} >
              <ErrorBar dataKey={vraWhiskerDataKey} legendType="none" zIndex="-1"/>
            </RechartsBar>
            <Scatter dataKey={vraMedianKey} shape={<VraMedianLine width={20} />} legendType="none" />
            <Tooltip content={<TooltipContent data={groupSummaries}/>} />
            <Legend align="right" verticalAlign="top" wrapperStyle={{paddingBottom: "16px", fontSize: "0.8rem"}} iconSize={8} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
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
  if (loading) return <div className="sim-placeholder">Loading minority effectiveness ensemble histogram...</div>;
  if (failed || !payload) return <div className="sim-placeholder">No minority effectiveness ensemble histogram data available.</div>;
  const { series, totalDistricts } = payload;
  const allDistricts = [...new Set([...series.raceBlind.map(d => d.effectiveDistricts), ...series.vraConstrained.map(d => d.effectiveDistricts)])].sort((a, b) => a - b);
  const chartData = allDistricts.map(n => {
    const rb = series.raceBlind.find(d => d.effectiveDistricts === n)?.frequency ?? 0;
    const vc = series.vraConstrained.find(d => d.effectiveDistricts === n)?.frequency ?? 0;
    return { effectiveDistricts: n, raceBlind: rb, vraConstrained: vc, maxVal: Math.max(rb, vc) };
  });
  return (
    <div id="sim-page-data-container">
      <div className="sim-chartStack">
        <div style={{ display: "flex", gap: "1.25rem", marginBottom: 3, justifyContent: "flex-end", fontSize: 13 }}>
          <span style={{fontSize: "0.75rem"}}><span style={{ display: "inline-block", width: 12, height: 12, background: "#5c6bc0", opacity: 0.55, marginRight: 5, verticalAlign: "middle" }} />Constrained: statewide score</span>
          <span style={{fontSize: "0.75rem"}}><span style={{ display: "inline-block", width: 12, height: 12, background: "#5aa75b", opacity: 0.55, marginRight: 5, verticalAlign: "middle" }} />Non-VRA</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, left: -1, bottom: 15 }} barCategoryGap={0}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="effectiveDistricts" ticks={Array.from({ length: totalDistricts + 1 }, (_, i) => i)} label={{ value: `Number of Districts with ${group} effectiveness > 60%`, position: "bottom", fontSize: "0.85rem" }} tick={{ fontSize: 12 }} />
            <YAxis label={{ value: "Plans", angle: -90, fontSize: "0.85rem", dx: -24 }} tick={{ fontSize: 12 }} />
            <Tooltip content={<HistogramTooltip />} />
            <RechartsBar dataKey="maxVal" shape={OverlappingBar} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// GUI-26
function rbBarDataKey(entry) {
  const data = entry.raceBlind;
  return [data.min, data.max];
}

function vraBarDataKey(entry) {
  const data = entry.vraConstrained;
  return [data.min, data.max];
}

function BarsTooltipContent({ active, activeIndex, data }) {
  if (!active) return null;

  const rbData = data[activeIndex].raceBlind;
  const vraData = data[activeIndex].vraConstrained;

  return (
    <div style={{ background: '#fafeff', border: 'solid 1px #ccc', padding: '0.5rem' }}>
      <div>Race-Blind Min: {rbData.min}</div>
      <div>VRA-Constrained Min: {vraData.min}</div>
      <div>Race-Blind Max: {rbData.max}</div>
      <div>VRA-Constrained Max: {vraData.max}</div>
    </div>
  );
}

// Minority-Effective Districts Bar Chart
function MinorityEffectiveDistrictsBar({ payload, loading, failed, totalDistricts }) {
  if (loading) return <div className="sim-placeholder">Loading minority-effective districts bar chart...</div>;
  if (failed || !payload) return <div className="sim-placeholder">No minority-effective districts bar chart data available.</div>;
  const ticks = Array.from({ length: (totalDistricts ?? 7) + 1 }, (_, i) => i);
  const BAR_SIZE = 150;

  return (
    <div id="sim-page-data-container">
      <div className="sim-chartStack">
        <div className="sim-chartSubtitle">Range of Minority-Effective Districts</div>
        <ResponsiveContainer style={{ width: "100%", height: "100%" }}>
          <ComposedChart data={payload} width="100%" height="100%" margin={{left: -20, bottom: 20}}>
            <XAxis dataKey="label" label={{ value: 'Racial Group', position: "bottom", fontSize : "0.8rem"}} tick={{ fontSize: "0.75rem" }} allowDuplicatedCategory={false}/>
            <YAxis width={55} label={{ value: "Number of Minority-Effective Districts", fontSize : "0.8rem", angle: -90}} tick={{ fontSize: "0.75rem" }} ticks={ticks}/>
            <CartesianGrid vertical={false} />
            <RechartsBar name="Race-Blind Ensemble" dataKey={rbBarDataKey} fill="#1b9e77" stroke="black" strokeWidth={1} barSize={BAR_SIZE} />
            <RechartsBar name="Vra-Constrained Ensemble" dataKey={vraBarDataKey} fill="#d95f02" stroke="black" strokeWidth={1} barSize={BAR_SIZE} />
            <Tooltip content={<BarsTooltipContent data={payload}/>} />
            <Legend align="right" verticalAlign="top" wrapperStyle={{paddingBottom: "16px", fontSize: "0.8rem"}} iconSize={8} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Majority-Minority Districts Bar Chart
function MajorityMinorityDistrictsBar({ payload, loading, failed, totalDistricts }) {
  if (loading) return <div className="sim-placeholder">Loading majority-minority districts bar chart...</div>;
  if (failed || !payload) return <div className="sim-placeholder">No majority-minority districts bar chart data available.</div>;
  const ticks = Array.from({ length: (totalDistricts ?? 7) + 1 }, (_, i) => i);
  const BAR_SIZE = 150;

  return (
    <div id="sim-page-data-container">
      <div className="sim-chartStack">
        <div className="sim-chartSubtitle">Range of Majority-Minority Districts</div>
        <ResponsiveContainer style={{ width: "100%", height: "100%" }}>
          <ComposedChart data={payload} width="100%" height="100%" margin={{left: -20, bottom: 20}}>
            <XAxis dataKey="label" label={{ value: 'Racial Group', position: "bottom", fontSize : "0.8rem"}} tick={{ fontSize: "0.75rem" }} allowDuplicatedCategory={false}/>
            <YAxis width={55} label={{ value: "Number of Majority-Minority Districts", fontSize : "0.8rem", angle: -90}} tick={{ fontSize: "0.75rem" }} ticks={ticks}/>
            <CartesianGrid vertical={false} />
            <RechartsBar name="Race-Blind Ensemble" dataKey={rbBarDataKey} fill="#1b9e77" stroke="black" strokeWidth={1} barSize={BAR_SIZE} />
            <RechartsBar name="Vra-Constrained Ensemble" dataKey={vraBarDataKey} fill="#d95f02" stroke="black" strokeWidth={1} barSize={BAR_SIZE} />
            <Tooltip content={<BarsTooltipContent data={payload}/>} />
            <Legend align="right" verticalAlign="top" wrapperStyle={{paddingBottom: "16px", fontSize: "0.8rem"}} iconSize={8} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Simulation({ currMap, currMinority, switchMinority, currSimData }) {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);
  const groupKey = toGroupKey(currMinority) ?? defaultGroup(stateCode);

  const topo = useDistrictTopology(stateCode);
  const splits = useEnsembleSplits(stateCode);
  const [currRbEnsemble, switchRbEnsemble] = useState(1);
  const [currVraEnsemble, switchVraEnsemble] = useState(1);

  const isOregon = stateCode === "OR";
  const gui21RbMaxOptions = isOregon ? 3 : 4;
  const gui21VraMaxOptions = 4;

  useEffect(() => {
    if (currRbEnsemble > gui21RbMaxOptions) {
      switchRbEnsemble(gui21RbMaxOptions);
    }
  }, [currRbEnsemble, gui21RbMaxOptions]);

  const bwRace = useBoxWhisker(stateCode, groupKey, 'race_blind', currRbEnsemble);
  const bwVra = useBoxWhisker(stateCode, groupKey, 'vra_constrained', currVraEnsemble);
  const vraImpact = useVraImpact(stateCode, groupKey);

  const [tab, setTab] = useState("Box and Whisker");

  // Each side is independently cached and re-fetched when its dropdown changes.
  const meBwRb  = useMeBoxWhiskerRb(stateCode, currRbEnsemble);
  const meBwVra = useMeBoxWhiskerVra(stateCode, currVraEnsemble);

  // Merge: take raceBlindSummary from the rb response and vraConstrainedSummary from vra.
  // Result has the same shape the chart component already expects.
  const meBwData = useMemo(() => {
    if (!meBwRb.data || !meBwVra.data) return null;
    return {
      ...meBwRb.data,
      groupSummaries: meBwRb.data.groupSummaries.map((g, i) => ({
        ...g,
        vraConstrainedSummary: meBwVra.data.groupSummaries[i]?.vraConstrainedSummary,
      })),
    };
  }, [meBwRb.data, meBwVra.data]);

  const meHist = useMeHistogram(stateCode, groupKey);
  const mmBar = useMajorityMinorityBar(stateCode);

  useEffect(() => {
    if (!groupOptionsForState(stateName).includes(currMinority))
      switchMinority(defaultGroup(stateCode));
  }, []);

  const mapData = topo.data ? topologyToFeatureCollection(topo.data, "districts") : null;

  // Derive minority-effective district ranges from the GUI-21 box-whisker data already in memory.
  const meBarPayload = useMemo(() => {
    if (!meBwData?.groupSummaries) return null;
    return meBwData.groupSummaries.map(g => ({
      label: g.label,
      raceBlind: { min: g.raceBlindSummary.min, max: g.raceBlindSummary.max },
      vraConstrained: { min: g.vraConstrainedSummary.min, max: g.vraConstrainedSummary.max },
    }));
  }, [meBwData]);

  // Transform API groups array into the chart's expected payload shape.
  const mmBarPayload = useMemo(() => {
    if (!mmBar.data?.groups) return null;
    return mmBar.data.groups.map(g => ({
      label: g.label,
      raceBlind: g.raceBlind,
      vraConstrained: g.vraConstrained,
    }));
  }, [mmBar.data]);

  function handleTabSelect(nextTab) {
    setTab(nextTab);
  }

  function renderPanel() {
    if (currSimData === "Ensemble Splits")
      return <EnsembleSplits payload={splits.data} loading={splits.isLoading} failed={splits.isError} />;
    if (currSimData === "Box Whisker")
      return (<>
        <div className="box-whisker-container">
          <BoxWhisker payload={bwRace.data} loading={bwRace.isLoading} failed={bwRace.isError} minority={currMinority} subtitle="Race-Blind Ensemble" ensembleType={"rb"} currEnsemble={currRbEnsemble} switchEnsemble={switchRbEnsemble} />
          <BoxWhisker payload={bwVra.data} loading={bwVra.isLoading} failed={bwVra.isError} minority={currMinority} subtitle="VRA-Constrained Ensemble" ensembleType={"vra"} currEnsemble={currVraEnsemble} switchEnsemble={switchVraEnsemble} />
        </div>
      </>);
    if (currSimData === "Minority Effectiveness")
      return (
      <div className="me-main-container">
        <MinorityEffectivenessTabBar tab={tab} onSelect={handleTabSelect} />
        {tab === "Box and Whisker" ?
          <>
            <MinorityEffectivenessBoxWhisker payload={meBwData} loading={meBwRb.isLoading || meBwVra.isLoading} failed={meBwRb.isError || meBwVra.isError} />
            <span className="ensemble-selectors-container">
              <EnsembleSelector ensembleType={"rb"} currEnsemble={currRbEnsemble} switchEnsemble={switchRbEnsemble} maxOptions={gui21RbMaxOptions} />
              <EnsembleSelector ensembleType={"vra"} currEnsemble={currVraEnsemble} switchEnsemble={switchVraEnsemble} maxOptions={gui21VraMaxOptions} />
            </span>
          </> :
          <MinorityEffectivenessHistogram payload={meHist.data} loading={meHist.isLoading} failed={meHist.isError} group={currMinority} />}
        <VRAImpact payload={vraImpact.data} loading={vraImpact.isLoading} failed={vraImpact.isError} />
      </div>);
    if (currSimData === "Minority Representation")
      return (<>
        <MinorityEffectiveDistrictsBar
          payload={meBarPayload}
          loading={meBwRb.isLoading || meBwVra.isLoading}
          failed={meBwRb.isError || meBwVra.isError}
          totalDistricts={meBwData?.totalDistricts}
        />
        <br />
        <MajorityMinorityDistrictsBar
          payload={mmBarPayload}
          loading={mmBar.isLoading}
          failed={mmBar.isError}
          totalDistricts={mmBar.data?.totalDistricts}
        />
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
