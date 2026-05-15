import React, { useEffect, useState } from "react";
import "../../styles/ei.css";
import { useParams } from "react-router-dom";
import { topologyToFeatureCollection } from "../utils/topology.js";
import { toStateCode, toGroupKey, defaultGroup, groupOptionsForState } from "../utils/stateUtils.js";
import { useDistrictTopology, useEiSupport, useEiPrecinctBarCi, useEiKde } from "../queries/stateQueries.js";
import DistrictMap from "./DistrictMap";
import MinorityHeatMap from "./MinorityHeatMap";
import EiSupportChart from "../charts/EiSupportChart.jsx";
import MinoritySelector from "./MinoritySelector.jsx";
import arrowDropdown from "/white_arrow_drop_down.svg";
import { ResponsiveContainer, BarChart, ComposedChart, Bar as RechartsBar, XAxis, YAxis, CartesianGrid, Tooltip, ErrorBar, Area, ReferenceLine, ReferenceArea } from "recharts";

const CANDIDATE_PARTY = { "Kamala Harris": "DEM", "Donald Trump": "REP" };

function EiTabBar({ tab, onSelect }) {
  function cls(name) { return `eiDataTab${tab === name ? " eiActiveTab" : ""}`; }
  return (
    <span className="eiLabelsContainer">
      {["Analysis", "Bar Chart", "Polarization KDE"].map(name => (
        <div key={name} className={cls(name)} onClick={() => onSelect(name)}>{name}</div>
      ))}
    </span>
  );
}

// GUI-12: EI Analysis — support distribution
function CandidateSelector({ selectedCandidate, switchCandidate }) {
  const [showList, setShowList] = useState(false);
  const candidateList = ["Kamala Harris", "Donald Trump"];

  function toggleList() {
    setShowList(!showList);
  }

  return (
    <div className="candidate-selector-container">
      <span className="candidate-selector-selected" onClick={() => toggleList()}>
        {selectedCandidate}
        <img id="dropdown-icon" src={arrowDropdown} width="20px"/>
      </span>
      {showList && (
      <div className="candidate-selector-dropdown-container">
        {candidateList.map((candidate) => (
          <span key={candidate} className={selectedCandidate === candidate ? "candidate-selector-selected" : "candidate-selector-option"}
          onClick={() => {switchCandidate(candidate); toggleList();}}>
            {candidate}
          </span>
        ))}
      </div>
      )}
    </div>
  );
}

function EiAnalysisPanel({ payload, loading, failed, minority, selectedCandidate, switchCandidate }) {
  if (loading) return <div className="ei_placeholder">Loading EI support...</div>;
  if (failed || !payload) return <div className="ei_placeholder">No EI support data available for {minority}.</div>;
  return (
    <div className="ei-chartStack">
      <div className="ei-chartTitle">Support for
        <CandidateSelector selectedCandidate={selectedCandidate} switchCandidate={switchCandidate} />
      </div>
      <div className="ei-chartSubtitle">Estimated support distribution by group</div>
      <EiSupportChart payload={payload} showHeader={false} />
    </div>
  );
}

// GUI-13: EI Bar Chart with confidence intervals
function EiBarPanel({ payload, loading, failed, selectedCandidate, switchCandidate }) {
  if (loading) return <div className="ei_placeholder">Loading EI bar chart...</div>;
  if (failed || !payload) return <div className="ei_placeholder">No EI bar data available.</div>;
  const data = (payload.categories ?? []).map(cat => ({ category: cat.category, peak: cat.peak, ciError: [cat.peak - cat.ciLow, cat.ciHigh - cat.peak] }));
  return (
    <div className="ei-chartStack">
      <div className="ei-chartTitle">Support for
        <CandidateSelector selectedCandidate={selectedCandidate} switchCandidate={switchCandidate} />
      </div>
      <div className="ei-chartSubtitle">Peak support with 95% CI by group &mdash; {payload.election}</div>
      <div style={{ width: "100%", height: "55vh" }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 12, right: 18, left: 12, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
            <XAxis dataKey="category" tick={{ fontSize: 12 }} label={{ value: 'Racial Group', position: "bottom", fontSize : "0.75rem"}} />
            <YAxis domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} tick={{ fontSize: 12 }} label={{ value: "Est. Support", angle: -90, position: "insideLeft", offset: -2, style: { fontSize: 12 } }} />
            <Tooltip formatter={v => `${(v * 100).toFixed(1)}%`} />
            <RechartsBar dataKey="peak" name="Peak Support" fill="#2a9d8f">
              <ErrorBar dataKey="ciError" width={4} strokeWidth={2} stroke="#264653" direction="y" />
            </RechartsBar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// GUI-15: EI KDE — step-function histogram fill with smooth KDE curve overlay and threshold region
function EiKdePanel({ payload, loading, failed, minority, selectedCandidate, switchCandidate }) {
  if (loading) return <div className="ei_placeholder">Loading EI KDE...</div>;
  if (failed || !payload) return <div className="ei_placeholder">No EI KDE data available for {minority}.</div>;
  const gapSeries = payload.series?.[0];
  const raw = (gapSeries?.points ?? []).map(pt => ({ x: pt.x, density: pt.density })).sort((a, b) => a.x - b.x);
  // Pad with zero-density anchors so the step histogram rises from and falls back to zero
  // regardless of how far the seeded data extends within the [-1, 1] domain.
  const binWidth = raw.length > 1 ? (raw[raw.length - 1].x - raw[0].x) / (raw.length - 1) : 0.01;
  const data = [
    ...(raw.length > 0 && raw[0].x > -1 ? [{ x: -1, density: 0 }] : []),
    ...raw,
    ...(raw.length > 0 ? [{ x: Math.min(raw[raw.length - 1].x + binWidth, 1), density: 0 }] : []),
    ...(raw.length > 0 && raw[raw.length - 1].x + binWidth < 1 ? [{ x: 1, density: 0 }] : []),
  ];
  const thresholdPct = payload.thresholdProbability != null ? `${(payload.thresholdProbability * 100).toFixed(1)}%` : null;
  const thresholdLabel = thresholdPct && payload.thresholdLabel ? `${payload.thresholdLabel} = ${thresholdPct}` : null;
  return (
    <div className="ei-chartStack">
      <div className="ei-chartTitle">Polarization KDE for
        <CandidateSelector selectedCandidate={selectedCandidate} switchCandidate={switchCandidate} />
      </div>
      <div style={{ width: "100%", height: "55vh" }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 12, right: 24, left: 12, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
            <XAxis dataKey="x" type="number" domain={[-1, 1]} tickFormatter={v => v.toFixed(2)} tick={{ fontSize: 12 }} label={{ value: `(${minority} − non-${minority}) support for ${selectedCandidate}`, position: "insideBottom", offset: -20, fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} label={{ value: "Density", angle: -90, position: "insideLeft", offset: -2, style: { fontSize: 12 } }} />
            <Tooltip formatter={(v) => [v.toFixed(4), "Density"]} labelFormatter={v => `Gap: ${Number(v).toFixed(3)}`} />
            {payload.thresholdX != null && (
              <ReferenceArea x1={payload.thresholdX} x2={1} fill="#9ca3af" fillOpacity={0.25} label={{ value: thresholdLabel ?? "", position: "insideTopRight", fontSize: 11, fill: "#374151" }} />
            )}
            <Area type="step" dataKey="density" fill="#2a9d8f" fillOpacity={0.75} stroke="none" dot={false} activeDot={false} isAnimationActive={false} />
            <Area type="monotone" dataKey="density" stroke="#2a9d8f" fill="none" dot={false} activeDot={false} strokeWidth={2} isAnimationActive={false} />
            {payload.thresholdX != null && (
              <ReferenceLine x={payload.thresholdX} stroke="#555" strokeWidth={1.5} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function EI({ currMap, currMinority, switchMinority, currPolarization, switchPolarization }) {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);
  const groupKey = toGroupKey(currMinority) ?? defaultGroup(stateCode);

  const [tab, setTab] = useState("Analysis");
  const [selectedCandidate, switchCandidate] = useState("Kamala Harris");
  const party = CANDIDATE_PARTY[selectedCandidate] ?? 'DEM';

  const topo = useDistrictTopology(stateCode);
  const eiSupp = useEiSupport(stateCode, groupKey, party);
  const eiBar = useEiPrecinctBarCi(stateCode, groupKey, party);
  const eiKde = useEiKde(stateCode, groupKey, party);

  useEffect(() => {
    if (!groupOptionsForState(stateName).includes(currMinority))
      switchMinority(defaultGroup(stateCode));
  }, []);

  if (!stateCode) return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Error: State not found</div>;

  const mapData = topo.data ? topologyToFeatureCollection(topo.data, "districts") : null;

  function handleTabSelect(nextTab) {
    setTab(nextTab);
  }

  function renderPanel() {
    if (tab === "Analysis")
      return <EiAnalysisPanel payload={eiSupp.data} loading={eiSupp.isLoading} failed={eiSupp.isError} minority={currMinority} selectedCandidate={selectedCandidate} switchCandidate={switchCandidate} />;
    if (tab === "Bar Chart")
      return <EiBarPanel payload={eiBar.data} loading={eiBar.isLoading} failed={eiBar.isError} selectedCandidate={selectedCandidate} switchCandidate={switchCandidate} />;
    if (tab === "Polarization KDE")
      return <EiKdePanel payload={eiKde.data} loading={eiKde.isLoading} failed={eiKde.isError} minority={currMinority} selectedCandidate={selectedCandidate} switchCandidate={switchCandidate} />;
    return null;
  }

  return (
    <span id="ei-page-main">
      <div id="ei-page-map-container">
        <div className="ei-page-map-label">
          {currMap === 'Precinct Heat Map' ? `${currMap} of ${currMinority} Population in ${stateName}` : `Current Congressional Districts of ${stateName}`}
        </div>
        {currMap === "District Map" ? <DistrictMap stateName={stateName} data={mapData} /> : <MinorityHeatMap currMinority={currMinority} switchMinority={switchMinority} />}
        {topo.isLoading && <div className="ei-page-status-message">Loading {stateName} {currMap}...</div>}
        {topo.isError && <div className="ei-page-status-message">Unable to load {stateName} {currMap}</div>}
      </div>
      <div id="ei-page-chart-main-container">
        <div className="ei-page-chart-label">{currPolarization}</div>
        <EiTabBar tab={tab} onSelect={handleTabSelect} />
        <div id="ei-page-chart-container">
          {renderPanel()}
        </div>
      </div>
    </span>
  );
}
