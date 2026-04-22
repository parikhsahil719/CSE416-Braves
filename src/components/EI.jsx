import React, { useEffect, useState } from "react";
import "../../styles/ei.css";
import { useParams } from "react-router-dom";
import axios from "axios";
import { topologyToFeatureCollection } from "../utils/topology.js";
import DistrictMap from "./DistrictMap";
import MinorityHeatMap from "./MinorityHeatMap";
import EiSupportChart from "../charts/EiSupportChart.jsx";
import {
  ResponsiveContainer,
  BarChart,
  ComposedChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ErrorBar,
  Area,
  ReferenceLine,
} from "recharts";

function toStateCode(stateName) {
  if (stateName === "Oregon") return "OR";
  if (stateName === "South Carolina") return "SC";
  return null;
}

function toGroupKey(minority) {
  const MAP = { Latino: "latino", Asian: "asian", Black: "black", White: "white" };
  return MAP[minority] ?? (minority ? minority.toLowerCase() : null);
}

function defaultGroup(stateCode) {
  return stateCode === "OR" ? "latino" : "black";
}

// GUI-12: EI Analysis — support distribution
function EiAnalysisPanel({ payload, loading, failed, minority }) {
  if (loading) return <div className="ei_placeholder">Loading EI support...</div>;
  if (failed || !payload) return <div className="ei_placeholder">No EI support data available for {minority}.</div>;
  return (
    <div className="ei-chartStack">
      <div className="ei-chartTitle">Support for {payload.selectedCandidate}</div>
      <div className="ei-chartSubtitle">Estimated support distribution by group</div>
      <EiSupportChart payload={payload} showHeader={false} />
    </div>
  );
}

// GUI-13: EI Bar Chart with confidence intervals
function EiBarPanel({ payload, loading, failed }) {
  if (loading) return <div className="ei_placeholder">Loading EI bar chart...</div>;
  if (failed || !payload) return <div className="ei_placeholder">No EI bar data available.</div>;

  const data = (payload.categories ?? []).map((cat) => ({
    category: cat.category,
    peak: cat.peak,
    ciError: [cat.peak - cat.ciLow, cat.ciHigh - cat.peak],
  }));

  return (
    <div className="ei-chartStack">
      <div className="ei-chartTitle">Support for {payload.selectedCandidate}</div>
      <div className="ei-chartSubtitle">
        Peak support with 95% CI by group &mdash; {payload.election}
      </div>
      <div style={{ width: "100%", height: "320px" }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 12, right: 18, left: 12, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
            <XAxis dataKey="category" tick={{ fontSize: 12 }} />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              tick={{ fontSize: 12 }}
              label={{ value: "Est. Support", angle: -90, position: "insideLeft", offset: -2, style: { fontSize: 12 } }}
            />
            <Tooltip formatter={(v) => `${(v * 100).toFixed(1)}%`} />
            <RechartsBar dataKey="peak" name="Peak Support" fill="#2a9d8f">
              <ErrorBar dataKey="ciError" width={4} strokeWidth={2} stroke="#264653" direction="y" />
            </RechartsBar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// GUI-15: EI KDE — single support-gap curve with threshold reference line
function EiKdePanel({ payload, loading, failed, minority }) {
  if (loading) return <div className="ei_placeholder">Loading EI KDE...</div>;
  if (failed || !payload) return <div className="ei_placeholder">No EI KDE data available for {minority}.</div>;

  // Single series: support_gap density points
  const gapSeries = payload.series?.[0];
  const data = (gapSeries?.points ?? [])
    .map((pt) => ({ x: pt.x, density: pt.density }))
    .sort((a, b) => a.x - b.x);

  const thresholdPct = payload.thresholdProbability != null
    ? `${(payload.thresholdProbability * 100).toFixed(0)}%`
    : null;

  return (
    <div className="ei-chartStack">
      <div className="ei-chartTitle">{payload.metricLabel}</div>
      {thresholdPct && (
        <div className="ei-chartSubtitle">
          {payload.thresholdLabel}: <strong>{thresholdPct}</strong>
        </div>
      )}
      <div style={{ width: "100%", height: "320px" }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 12, right: 18, left: 12, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
            <XAxis
              dataKey="x"
              type="number"
              domain={payload.domain ?? ["auto", "auto"]}
              tickFormatter={(v) => v.toFixed(2)}
              tick={{ fontSize: 12 }}
              label={{ value: "Support gap (minority − non-minority)", position: "insideBottom", offset: -20, fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{ value: "Density", angle: -90, position: "insideLeft", offset: -2, style: { fontSize: 12 } }}
            />
            <Tooltip formatter={(v) => [v.toFixed(4), "Density"]} labelFormatter={(v) => `Gap: ${Number(v).toFixed(3)}`} />
            {/* Histogram bars */}
            <RechartsBar dataKey="density" name="Density" fill="#2a9d8f44" stroke="none" isAnimationActive={false} />
            {/* KDE curve overlay */}
            <Area
              type="monotone"
              dataKey="density"
              name={gapSeries?.label ?? "Support gap"}
              stroke="#2a9d8f"
              fill="none"
              dot={false}
              activeDot={false}
              strokeWidth={2.5}
              isAnimationActive={false}
            />
            {/* Threshold reference line */}
            {payload.thresholdX != null && (
              <ReferenceLine
                x={payload.thresholdX}
                stroke="#e63946"
                strokeWidth={2}
                strokeDasharray="6 3"
                label={{
                  value: `threshold: ${payload.thresholdX}`,
                  position: "insideTopRight",
                  fill: "#e63946",
                  fontSize: 11,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function EI(props) {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);
  const { currMap, currMinority, switchMinority, currEI, switchEI } = props;
  const OregonGroups = ["Latino", "Asian"];
  const SCGroups = ["Black", "Latino"];
  const minorityOptions = stateName === "Oregon" ?
    OregonGroups.map((minority) =>
    <option
      key={minority}
      value={minority}
    >
      {minority}
    </option>)
  : SCGroups.map((minority) =>
    <option
      key={minority}
      value={minority}
    >
      {minority}
    </option>);


  const groupKey = toGroupKey(currMinority) ?? defaultGroup(stateCode);

  // District topology for map panel
  const [mapLoading, setMapLoading] = useState(false);
  const [mapData, setMapData] = useState(null);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);

  // GUI-12: EI support distribution
  const [eiPayload, setEiPayload] = useState(null);
  const [eiLoading, setEiLoading] = useState(false);
  const [eiLoadFailed, setEiLoadFailed] = useState(false);

  // GUI-13: EI precinct bar + CI
  const [barPayload, setBarPayload] = useState(null);
  const [barLoading, setBarLoading] = useState(false);
  const [barLoadFailed, setBarLoadFailed] = useState(false);

  // GUI-15: EI KDE
  const [kdePayload, setKdePayload] = useState(null);
  const [kdeLoading, setKdeLoading] = useState(false);
  const [kdeLoadFailed, setKdeLoadFailed] = useState(false);

  // Load district topology
  useEffect(() => {
    if (!stateCode) {
      setMapLoadFailed(true);
      return undefined;
    }
    let isActive = true;
    setMapLoading(true);
    setMapData(null);
    setMapLoadFailed(false);
    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/districts/enacted/topology`);
        if (isActive) setMapData(topologyToFeatureCollection(response.data, "districts"));
      } catch {
        if (isActive) setMapLoadFailed(true);
      } finally {
        if (isActive) setMapLoading(false);
      }
    })();
    return () => { isActive = false; };
  }, [stateCode]);

  // GUI-12: EI support
  useEffect(() => {
    if (!stateCode) return undefined;
    let isActive = true;
    setEiLoading(true);
    setEiPayload(null);
    setEiLoadFailed(false);
    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/analysis/ei-support`, {
          params: { groups: groupKey, election: "2024_pres", party: "DEM" },
        });
        if (isActive) setEiPayload(response.data);
      } catch {
        if (isActive) setEiLoadFailed(true);
      } finally {
        if (isActive) setEiLoading(false);
      }
    })();
    return () => { isActive = false; };
  }, [stateCode, groupKey]);

  // GUI-13: EI precinct bar + CI
  useEffect(() => {
    if (!stateCode) return undefined;
    let isActive = true;
    setBarLoading(true);
    setBarPayload(null);
    setBarLoadFailed(false);
    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/analysis/ei-precinct-bar-ci`, {
          params: { group: groupKey, election: "2024_pres", party: "DEM" },
        });
        if (isActive) setBarPayload(response.data);
      } catch {
        if (isActive) setBarLoadFailed(true);
      } finally {
        if (isActive) setBarLoading(false);
      }
    })();
    return () => { isActive = false; };
  }, [stateCode, groupKey]);

  // GUI-15: EI KDE
  useEffect(() => {
    if (!stateCode) return undefined;
    let isActive = true;
    setKdeLoading(true);
    setKdePayload(null);
    setKdeLoadFailed(false);
    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/analysis/ei-kde`, {
          params: { group: groupKey, election: "2024_pres", metric: "support_gap" },
        });
        if (isActive) setKdePayload(response.data);
      } catch {
        if (isActive) setKdeLoadFailed(true);
      } finally {
        if (isActive) setKdeLoading(false);
      }
    })();
    return () => { isActive = false; };
  }, [stateCode, groupKey]);

  if (!stateCode) {
    return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Error: State not found</div>;
  }

  // cleanup
  useEffect(() => {
    return () => switchEI('');
  }, [])

  function renderActivePanel() {
    if (currEI === "EI Analysis") {
      return (
        <>
          <div className="minority-selector-container">
            <label htmlFor="minoritySelector" style={{ fontWeight: "bolder" }}>Select a racial group: </label>
            <select name="minoritySelector" value={currMinority} onChange={(e) => {switchMinority(e.target.value)}}>
              {minorityOptions}
            </select>
          </div>
          <EiAnalysisPanel payload={eiPayload} loading={eiLoading} failed={eiLoadFailed} minority={currMinority} />
        </>
      );
    }
    if (currEI === "EI Bar Chart") {
      return <EiBarPanel payload={barPayload} loading={barLoading} failed={barLoadFailed} minority={currMinority} />;
    }
    if (currEI === "EI KDE") {
      return <EiKdePanel payload={kdePayload} loading={kdeLoading} failed={kdeLoadFailed} minority={currMinority} />;
    }
    return null;
  }

  return (
    <span id="ei-page-main">
      <div id="ei-page-map-container">
        <div className="ei-page-map-label">
          {props.currMap === 'Precinct Heat Map' ? `${props.currMap} of ${props.currMinority} Population in ${stateName}` : `Map of Current Congressional Districts of ${stateName}`}
        </div>
        {currMap === "District Map" ? (
          <DistrictMap stateName={stateName} data={mapData} />
        ) : (
          <MinorityHeatMap currMinority={currMinority} switchMinority={switchMinority} />
        )}
        {mapLoading && (
          <div className="ei-page-status-message">Loading {stateName} {currMap}...</div>
        )}
        {mapLoadFailed && (
          <div className="ei-page-status-message">Unable to load {stateName} {currMap}</div>
        )}
      </div>

      <div id="ei-page-chart-main-container">
        <div className="ei-page-chart-label">{currEI}</div>
        {renderActivePanel()}
      </div>
    </span>
  );
}
