import React, { useEffect, useState } from "react";
import "../../styles/simulation.css";
import { useParams } from "react-router-dom";
import axios from "axios";
import { topologyToFeatureCollection } from "../utils/topology.js";
import DistrictMap from "./DistrictMap";
import MinorityHeatMap from "./MinorityHeatMap";
import BoxWhiskerChart from "../charts/BoxWhiskerChart.jsx"
import {
  ResponsiveContainer,
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ErrorBar,
  AreaChart,
  Area,
  Legend,
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

// GUI-16: Ensemble Splits
function EnsembleSplits({ payload, loading, failed }) {
  if (loading) return <div className="sim_placeholder">Loading ensemble splits...</div>;
  if (failed || !payload) return <div className="sim_placeholder">No ensemble splits data available.</div>;
  return (
    <div className="sim-chartStack">
      <div className="sim-chartTitle">Ensemble Splits</div>
    </div>
  );
}

// GUI-17: Box & Whisker
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

// GUI-20: VRA Impact Table
function VRAImpact({ payload, loading, failed, minority }) {
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
              <tr className={"vra-impact-table-row"}>
                <td className="vra-impact-table-data">Satisfies Enacted Effectiveness</td>
                <td className="vra-impact-table-data">% of RB plans</td>
                <td className="vra-impact-table-data">% of VRA plans</td>
              </tr>
              <tr className={"vra-impact-table-row"}>
                <td className="vra-impact-table-data">Satisfies Rough Proportionality</td>
                <td className="vra-impact-table-data">% of RB plans</td>
                <td className="vra-impact-table-data">% of VRA plans</td>
              </tr>
              <tr className={"vra-impact-table-row"}>
                <td className="vra-impact-table-data">Satisfies Both Conditions</td>
                <td className="vra-impact-table-data">% of RB plans</td>
                <td className="vra-impact-table-data">% of VRA plans</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// GUI-21: Minority Effectiveness Box & Whisker
function MinorityEffectivenessBoxWhisker({ payload, loading, failed, minority }) {
  if (loading) return <div className="sim_placeholder">Loading minority effectiveness box & whisker...</div>;
  if (failed || !payload) return <div className="sim_placeholder">No minority effectiveness box & whisker data available.</div>;
  return (
    <div className="sim-chartStack">
      <div className="sim-chartTitle">Ensemble Splits</div>
    </div>
  );
}

// GUI-22: Minority Effectiveness Ensemble Histogram
function MinorityEffectivenessHistogram({ payload, loading, failed, minority }) {
  if (loading) return <div className="sim_placeholder">Loading minority effectiveness ensemble histogram...</div>;
  if (failed || !payload) return <div className="sim_placeholder">No minority effectiveness ensemble histogram data available.</div>;
  return (
    <div className="sim-chartStack">
      <div className="sim-chartTitle">Ensemble Splits</div>
    </div>
  );
}

export default function Simulation(props) {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);
  const { currMap, currMinority, switchMinority, currSimData, switchSimData } = props;
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

  // GUI-16: Ensemble Splits
  const [splitsPayload, setSplitsPayload] = useState(null);
  const [splitsLoading, setSplitsLoading] = useState(false);
  const [splitsLoadFailed, setSplitsLoadFailed] = useState(false);

  // GUI-17: Box & Whisker
  const [boxWhiskerPayloads, setBoxWhiskerPayloads] = useState(null);
  const [boxWhiskerLoading, setBoxWhiskerLoading] = useState(false);
  const [boxWhiskerLoadFailed, setBoxWhiskerLoadFailed] = useState(false);

  // GUI-20: VRA Impact Table

  // GUI-21: Minority Effectiveness Box & Whisker

  // GUI-22: Minority Effectiveness Ensemble Histogram

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

  // GUI-17: Box & Whisker
  useEffect(() => {
    let isActive = true;
    setBoxWhiskerLoading(true);
    setBoxWhiskerPayloads(null);
    setBoxWhiskerLoadFailed(false);
    const stateCode = stateName === "Oregon" ? "OR" : stateName === "South Carolina" ? "SC" : null;
    const group = currMinority?.trim().toLowerCase().replace(/\s+/g, "_");

    if (!stateCode || !group) {
      setBoxWhiskerPayloads(null);
      return undefined;
    }

    (async () => {
      try {
        const [vraConstrained, raceBlind] = await Promise.all([
          axios.get(`/api/states/${stateCode}/ensembles/box-whisker`, {
            params: { group, ensembleType: "vra_constrained", metric: "minority_share" },
          }),
          axios.get(`/api/states/${stateCode}/ensembles/box-whisker`, {
            params: { group, ensembleType: "race_blind", metric: "minority_share" },
          }),
        ]);

        if (isActive) {
          setBoxWhiskerPayloads({
            vraConstrained: vraConstrained.data,
            raceBlind: raceBlind.data,
          });
        }
      } catch {
        if (isActive) {
          setBoxWhiskerPayloads(null);
          setBoxWhiskerLoadFailed(true);
        }
      } finally{
        setBoxWhiskerLoading(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [currMinority, stateName]);

  // cleanup
  useEffect(() => {
    return () => switchSimData('');
  }, [])

  function renderActivePanel() {
    if (currSimData === "Ensemble Splits") {
      return <EnsembleSplits />;
    }
    if (currSimData === "Box Whisker") {
      return (
        <>
          <div className="minority-selector-container">
            <label htmlFor="minoritySelector" style={{ fontWeight: "bolder" }}>Select a racial group: </label>
            <select name="minoritySelector" value={currMinority} onChange={(e) => {switchMinority(e.target.value)}}>
              {minorityOptions}
            </select>
          </div>
          <BoxWhisker
            payload={boxWhiskerPayloads?.raceBlind ?? null}
            loading={boxWhiskerLoading}
            failed={boxWhiskerLoadFailed}
            minority={currMinority}
            subtitle={`Race-Blind Ensemble`}
          />
          <BoxWhisker
            payload={boxWhiskerPayloads?.vraConstrained ?? null}
            loading={boxWhiskerLoading}
            failed={boxWhiskerLoadFailed}
            minority={currMinority}
            subtitle={`VRA-Constrained Ensemble`}
          />
        </>
      );
    }
    if (currSimData === "Minority Effectiveness Box Whisker") {
      return (
        <>
          <MinorityEffectivenessBoxWhisker />
          <VRAImpact />
        </>
      );
    }
    if (currSimData === "Minority Effectiveness Histogram") {
      return (
        <>
          <MinorityEffectivenessHistogram />
          <VRAImpact />
        </>
      );
    }
    return null;
  }

  return (
    <span id="sim-page-main">
      <div id="sim-page-map-container">
        <div className="sim-page-map-label">
          {props.currMap === 'Precinct Heat Map' ? `${props.currMap} of ${props.currMinority} Population` : props.currMap}
        </div>
        {currMap === "District Map" ? (
          <DistrictMap stateName={stateName} data={mapData} />
        ) : (
          <MinorityHeatMap currMinority={currMinority} switchMinority={switchMinority} />
        )}
        {mapLoading && (
          <div className="sim-page-status-message">Loading {stateName} {currMap}...</div>
        )}
        {mapLoadFailed && (
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
