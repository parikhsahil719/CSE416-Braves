import React, { useEffect } from "react";
import "../../styles/simulation.css";
import { useParams } from "react-router-dom";
import DistrictMap from "./DistrictMap";
import MinorityHeatMap from "./MinorityHeatMap";
import BoxWhiskerChart from "../charts/BoxWhiskerChart.jsx";
import { pct } from "../utils/chartFormat.js";
import { defaultGroup, toGroupKey, toStateCode } from "../lib/stateMetadata.js";
import {
  useBoxWhiskerQuery,
  useDistrictTopologyQuery,
  useEnsembleSplitsQuery,
  useMinorityEffectivenessBoxWhiskerQuery,
  useMinorityEffectivenessHistogramQuery,
  useVraImpactThresholdsQuery,
} from "../queries/stateQueries.js";
import {
  ResponsiveContainer,
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function EnsembleSplits({ payload, loading, failed }) {
  if (loading) return <div className="sim_placeholder">Loading ensemble splits...</div>;
  if (failed || !payload) return <div className="sim_placeholder">No ensemble splits data available.</div>;

  const { series } = payload;
  const allLabels = [
    ...new Set([
      ...series.raceBlind.map((d) => d.splitLabel),
      ...series.vraConstrained.map((d) => d.splitLabel),
    ]),
  ];
  const maxFreq = Math.max(
    ...series.raceBlind.map((d) => d.frequency),
    ...series.vraConstrained.map((d) => d.frequency),
  );
  const yMax = maxFreq + Math.ceil(maxFreq * 0.1) + 1;

  const rbData = allLabels.map((label) => ({
    splitLabel: label,
    frequency: series.raceBlind.find((d) => d.splitLabel === label)?.frequency ?? 0,
  }));
  const vraData = allLabels.map((label) => ({
    splitLabel: label,
    frequency: series.vraConstrained.find((d) => d.splitLabel === label)?.frequency ?? 0,
  }));

  const sharedMargin = { top: 5, right: 10, left: 0, bottom: 5 };

  return (
    <div className="sim-chartStack">
      <div className="sim-chartSubtitle">Race-Blind</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={rbData} margin={sharedMargin}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="splitLabel" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, yMax]} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [`${v} plans`, "Frequency"]} />
          <RechartsBar dataKey="frequency" fill="#60a5fa" name="Plans" />
        </BarChart>
      </ResponsiveContainer>
      <div className="sim-chartSubtitle" style={{ marginTop: "0.75rem" }}>VRA-Constrained</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={vraData} margin={sharedMargin}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="splitLabel" tick={{ fontSize: 12 }} />
          <YAxis domain={[0, yMax]} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => [`${v} plans`, "Frequency"]} />
          <RechartsBar dataKey="frequency" fill="#f97316" name="Plans" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function BoxWhisker({ payload, loading, failed, minority, subtitle }) {
  if (loading) return <div className="sim_placeholder">Loading box & whisker chart...</div>;
  if (failed || !payload) return <div className="sim_placeholder">No box & whisker data available for {minority}.</div>;
  return (
    <div className="sim-chartStack">
      <div className="sim-chartSubtitle">{subtitle}</div>
      <BoxWhiskerChart payload={payload} showHeader={false} />
    </div>
  );
}

function VRAImpact({ payload, loading, failed }) {
  const fallbackLabels = [
    "Meet or exceed enacted effective minority districts",
    "Achieve rough proportionality relative to minority CVAP share",
    "Satisfy both legal thresholds jointly",
  ];
  const rows =
    payload?.rows ??
    fallbackLabels.map((label) => ({
      metricLabel: label,
      raceBlindShare: null,
      vraConstrainedShare: null,
    }));

  const renderCell = (value) => {
    if (loading) return "Loading…";
    if (failed || value == null) return "—";
    return pct(value);
  };

  return (
    <>
      <div className="sim-page-data-label">VRA Impact Table</div>
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
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.metricKey ?? i} className="vra-impact-table-row">
                  <td className="vra-impact-table-data">{row.metricLabel}</td>
                  <td className="vra-impact-table-data">{renderCell(row.raceBlindShare)}</td>
                  <td className="vra-impact-table-data">{renderCell(row.vraConstrainedShare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function MinorityEffectivenessBoxWhisker({ payload, loading, failed }) {
  if (loading) return <div className="sim_placeholder">Loading minority effectiveness box & whisker...</div>;
  if (failed || !payload) return <div className="sim_placeholder">No minority effectiveness box & whisker data available.</div>;

  const { groupSummaries, totalDistricts } = payload;
  const width = 700;
  const height = 320;
  const margin = { top: 36, right: 20, bottom: 54, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const groupSlotWidth = innerWidth / groupSummaries.length;
  const boxWidth = Math.min(28, groupSlotWidth * 0.28);
  const yScale = (v) => margin.top + innerHeight - (v / totalDistricts) * innerHeight;
  const yTicks = Array.from({ length: totalDistricts + 1 }, (_, i) => i);

  function drawBox(summary, cx, fill) {
    const { min, q1, median, q3, max } = summary;
    return (
      <g key={`${cx}-${fill}`}>
        <line x1={cx} x2={cx} y1={yScale(min)} y2={yScale(max)} stroke="#475569" strokeWidth={1.35} />
        <line x1={cx - 5} x2={cx + 5} y1={yScale(min)} y2={yScale(min)} stroke="#475569" />
        <line x1={cx - 5} x2={cx + 5} y1={yScale(max)} y2={yScale(max)} stroke="#475569" />
        <rect
          x={cx - boxWidth / 2}
          y={yScale(q3)}
          width={boxWidth}
          height={Math.max(1, yScale(q1) - yScale(q3))}
          fill={fill}
          stroke="#1e3a8a"
          strokeWidth={1.5}
          opacity={0.85}
        />
        <line
          x1={cx - boxWidth / 2}
          x2={cx + boxWidth / 2}
          y1={yScale(median)}
          y2={yScale(median)}
          stroke="#1f2937"
          strokeWidth={2}
        />
      </g>
    );
  }

  return (
    <div className="sim-chartStack">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        preserveAspectRatio="xMidYMin meet"
        role="img"
        aria-label="Minority effectiveness box and whisker chart"
      >
        <rect width={width} height={height} fill="white" />
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={margin.left} x2={width - margin.right}
              y1={yScale(tick)} y2={yScale(tick)}
              stroke="#cbd5e1" strokeDasharray="3 3"
            />
            <text x={margin.left - 8} y={yScale(tick) + 5} fontSize={13} textAnchor="end" fill="#0f172a">
              {tick}
            </text>
          </g>
        ))}
        <line x1={margin.left} x2={margin.left} y1={margin.top} y2={height - margin.bottom} stroke="#475569" strokeWidth={1.2} />
        <line x1={margin.left} x2={width - margin.right} y1={height - margin.bottom} y2={height - margin.bottom} stroke="#475569" strokeWidth={1.2} />
        <text
          x={14}
          y={margin.top + innerHeight / 2}
          fontSize={13}
          fontWeight={700}
          fill="#0f172a"
          textAnchor="middle"
          transform={`rotate(-90 14 ${margin.top + innerHeight / 2})`}
        >
          Effective Districts
        </text>
        {groupSummaries.map((g, i) => {
          const groupCenterX = margin.left + groupSlotWidth * i + groupSlotWidth / 2;
          return (
            <g key={g.key}>
              {drawBox(g.raceBlindSummary, groupCenterX - boxWidth * 0.8, "#93c5fd")}
              {drawBox(g.vraConstrainedSummary, groupCenterX + boxWidth * 0.8, "#fb923c")}
              <text x={groupCenterX} y={height - margin.bottom + 20} fontSize={13} textAnchor="middle" fill="#0f172a">
                {g.label}
              </text>
            </g>
          );
        })}
        <rect x={margin.left + 10} y={8} width={14} height={14} fill="#93c5fd" stroke="#1e3a8a" strokeWidth={1.5} />
        <text x={margin.left + 28} y={19} fontSize={12} fill="#0f172a">Race-Blind</text>
        <rect x={margin.left + 110} y={8} width={14} height={14} fill="#fb923c" stroke="#1e3a8a" strokeWidth={1.5} />
        <text x={margin.left + 128} y={19} fontSize={12} fill="#0f172a">VRA-Constrained</text>
      </svg>
    </div>
  );
}

function MinorityEffectivenessHistogram({ payload, loading, failed }) {
  if (loading) return <div className="sim_placeholder">Loading minority effectiveness ensemble histogram...</div>;
  if (failed || !payload) return <div className="sim_placeholder">No minority effectiveness ensemble histogram data available.</div>;

  const { series } = payload;
  const allDistricts = [
    ...new Set([
      ...series.raceBlind.map((d) => d.effectiveDistricts),
      ...series.vraConstrained.map((d) => d.effectiveDistricts),
    ]),
  ].sort((a, b) => a - b);

  const chartData = allDistricts.map((n) => ({
    effectiveDistricts: n,
    raceBlind: series.raceBlind.find((d) => d.effectiveDistricts === n)?.frequency ?? 0,
    vraConstrained: series.vraConstrained.find((d) => d.effectiveDistricts === n)?.frequency ?? 0,
  }));

  return (
    <div className="sim-chartStack">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="effectiveDistricts"
            label={{ value: "Effective Districts", position: "insideBottom", offset: -15, fontSize: 13 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            label={{ value: "Plans", angle: -90, position: "insideLeft", fontSize: 13 }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip formatter={(v, name) => [`${v} plans`, name]} />
          <Legend verticalAlign="top" />
          <RechartsBar dataKey="raceBlind" name="Race-Blind" fill="#60a5fa" opacity={0.85} />
          <RechartsBar dataKey="vraConstrained" name="VRA-Constrained" fill="#f97316" opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Simulation(props) {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);
  const { currMap, currMinority, switchMinority, currSimData, switchSimData } = props;
  const oregonGroups = ["Latino", "Asian"];
  const scGroups = ["Black", "Latino"];
  const minorityOptions = (stateName === "Oregon" ? oregonGroups : scGroups).map((minority) => (
    <option key={minority} value={minority}>
      {minority}
    </option>
  ));

  const groupKey = toGroupKey(currMinority) ?? defaultGroup(stateCode);

  const districtTopologyQuery = useDistrictTopologyQuery(stateCode);
  const splitsQuery = useEnsembleSplitsQuery(stateCode);
  const raceBlindBoxWhiskerQuery = useBoxWhiskerQuery(stateCode, groupKey, "race_blind");
  const vraConstrainedBoxWhiskerQuery = useBoxWhiskerQuery(stateCode, groupKey, "vra_constrained");
  const vraImpactQuery = useVraImpactThresholdsQuery(stateCode, groupKey);
  const effectBoxWhiskerQuery = useMinorityEffectivenessBoxWhiskerQuery(stateCode);
  const effectHistogramQuery = useMinorityEffectivenessHistogramQuery(stateCode, groupKey);

  useEffect(() => {
    return () => switchSimData('');
  }, [switchSimData]);

  function renderMinoritySelector() {
    return (
      <div className="minority-selector-container">
        <label htmlFor="minoritySelector" style={{ fontWeight: "bolder" }}>Select a racial group: </label>
        <select name="minoritySelector" value={currMinority} onChange={(e) => switchMinority(e.target.value)}>
          {minorityOptions}
        </select>
      </div>
    );
  }

  function renderActivePanel() {
    if (currSimData === "Ensemble Splits") {
      return (
        <EnsembleSplits
          payload={splitsQuery.data}
          loading={splitsQuery.isPending && !splitsQuery.data}
          failed={splitsQuery.isError && !splitsQuery.data}
        />
      );
    }
    if (currSimData === "Box Whisker") {
      const boxLoading =
        (raceBlindBoxWhiskerQuery.isPending && !raceBlindBoxWhiskerQuery.data)
        || (vraConstrainedBoxWhiskerQuery.isPending && !vraConstrainedBoxWhiskerQuery.data);
      const boxFailed =
        (raceBlindBoxWhiskerQuery.isError && !raceBlindBoxWhiskerQuery.data)
        || (vraConstrainedBoxWhiskerQuery.isError && !vraConstrainedBoxWhiskerQuery.data);

      return (
        <>
          {renderMinoritySelector()}
          <BoxWhisker
            payload={raceBlindBoxWhiskerQuery.data ?? null}
            loading={boxLoading}
            failed={boxFailed}
            minority={currMinority}
            subtitle="Race-Blind Ensemble"
          />
          <BoxWhisker
            payload={vraConstrainedBoxWhiskerQuery.data ?? null}
            loading={boxLoading}
            failed={boxFailed}
            minority={currMinority}
            subtitle="VRA-Constrained Ensemble"
          />
        </>
      );
    }
    if (currSimData === "Minority Effectiveness Box Whisker") {
      return (
        <>
          <MinorityEffectivenessBoxWhisker
            payload={effectBoxWhiskerQuery.data}
            loading={effectBoxWhiskerQuery.isPending && !effectBoxWhiskerQuery.data}
            failed={effectBoxWhiskerQuery.isError && !effectBoxWhiskerQuery.data}
          />
          <VRAImpact
            payload={vraImpactQuery.data}
            loading={vraImpactQuery.isPending && !vraImpactQuery.data}
            failed={vraImpactQuery.isError && !vraImpactQuery.data}
          />
        </>
      );
    }
    if (currSimData === "Minority Effectiveness Histogram") {
      return (
        <>
          {renderMinoritySelector()}
          <MinorityEffectivenessHistogram
            payload={effectHistogramQuery.data}
            loading={effectHistogramQuery.isPending && !effectHistogramQuery.data}
            failed={effectHistogramQuery.isError && !effectHistogramQuery.data}
          />
          <VRAImpact
            payload={vraImpactQuery.data}
            loading={vraImpactQuery.isPending && !vraImpactQuery.data}
            failed={vraImpactQuery.isError && !vraImpactQuery.data}
          />
        </>
      );
    }
    return null;
  }

  return (
    <span id="sim-page-main">
      <div id="sim-page-map-container">
        <div className="sim-page-map-label">
          {props.currMap === 'Precinct Heat Map'
            ? `${props.currMap} of ${props.currMinority} Population in ${stateName}` : `Map of Current Congressional Districts of ${stateName}`}
        </div>
        {currMap === "District Map" ? (
          <DistrictMap stateName={stateName} data={districtTopologyQuery.data} />
        ) : (
          <MinorityHeatMap currMinority={currMinority} switchMinority={switchMinority} />
        )}
        {districtTopologyQuery.isPending && !districtTopologyQuery.data && (
          <div className="sim-page-status-message">Loading {stateName} {currMap}...</div>
        )}
        {districtTopologyQuery.isError && !districtTopologyQuery.data && (
          <div className="sim-page-status-message">Unable to load {stateName} {currMap}</div>
        )}
      </div>

      <div id="sim-page-data-main-container">
        <div className="sim-page-data-label">{currSimData}</div>
        {renderActivePanel()}
      </div>
    </span>
  );
}
