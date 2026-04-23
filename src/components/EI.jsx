import React, { useEffect } from "react";
import "../../styles/ei.css";
import { useParams } from "react-router-dom";
import DistrictMap from "./DistrictMap";
import MinorityHeatMap from "./MinorityHeatMap";
import EiSupportChart from "../charts/EiSupportChart.jsx";
import { defaultGroup, toGroupKey, toStateCode } from "../lib/stateMetadata.js";
import {
  useDistrictTopologyQuery,
  useEiKdeQuery,
  useEiPrecinctBarCiQuery,
  useEiSupportQuery,
} from "../queries/stateQueries.js";
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

function EiKdePanel({ payload, loading, failed, minority }) {
  if (loading) return <div className="ei_placeholder">Loading EI KDE...</div>;
  if (failed || !payload) return <div className="ei_placeholder">No EI KDE data available for {minority}.</div>;

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
            <RechartsBar dataKey="density" name="Density" fill="#2a9d8f44" stroke="none" isAnimationActive={false} />
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
  const oregonGroups = ["Latino", "Asian"];
  const scGroups = ["Black", "Latino"];
  const minorityOptions = stateName === "Oregon"
    ? oregonGroups.map((minority) => (
      <option key={minority} value={minority}>
        {minority}
      </option>
    ))
    : scGroups.map((minority) => (
      <option key={minority} value={minority}>
        {minority}
      </option>
    ));

  const groupKey = toGroupKey(currMinority) ?? defaultGroup(stateCode);
  const districtTopologyQuery = useDistrictTopologyQuery(stateCode);
  const eiSupportQuery = useEiSupportQuery(stateCode, groupKey, currEI === "EI Analysis");
  const eiBarQuery = useEiPrecinctBarCiQuery(stateCode, groupKey, currEI === "EI Bar Chart");
  const eiKdeQuery = useEiKdeQuery(stateCode, groupKey, currEI === "EI KDE");

  useEffect(() => {
    return () => switchEI('');
  }, [switchEI]);

  if (!stateCode) {
    return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Error: State not found</div>;
  }

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
          <EiAnalysisPanel
            payload={eiSupportQuery.data}
            loading={eiSupportQuery.isPending && !eiSupportQuery.data}
            failed={eiSupportQuery.isError && !eiSupportQuery.data}
            minority={currMinority}
          />
        </>
      );
    }
    if (currEI === "EI Bar Chart") {
      return (
        <EiBarPanel
          payload={eiBarQuery.data}
          loading={eiBarQuery.isPending && !eiBarQuery.data}
          failed={eiBarQuery.isError && !eiBarQuery.data}
          minority={currMinority}
        />
      );
    }
    if (currEI === "EI KDE") {
      return (
        <EiKdePanel
          payload={eiKdeQuery.data}
          loading={eiKdeQuery.isPending && !eiKdeQuery.data}
          failed={eiKdeQuery.isError && !eiKdeQuery.data}
          minority={currMinority}
        />
      );
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
          <DistrictMap stateName={stateName} data={districtTopologyQuery.data} />
        ) : (
          <MinorityHeatMap currMinority={currMinority} switchMinority={switchMinority} />
        )}
        {districtTopologyQuery.isPending && !districtTopologyQuery.data && (
          <div className="ei-page-status-message">Loading {stateName} {currMap}...</div>
        )}
        {districtTopologyQuery.isError && !districtTopologyQuery.data && (
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
