import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../../styles/simulation-minority-analysis.css";
import BoxWhiskerChart from "../charts/BoxWhiskerChart.jsx";

function renderUnsupportedCard(group) {
  return (
    <div className="simulationMinority_placeholderCard">
      <div className="simulationMinority_placeholderTitle">GUI-17</div>
      <div className="simulationMinority_placeholderLine">No backend GUI-17 payload is available for {group}.</div>
    </div>
  );
}

function EnsemblePanel({ eyebrow, title, subtitle, payload, group }) {
  return (
    <div className="simulationMinority_chartPanel">
      <div className="simulationMinority_chartEyebrow">{eyebrow}</div>
      <div className="simulationMinority_chartTitle">{title}</div>
      <div className="simulationMinority_chartSubtitle">{subtitle}</div>
      {payload && payload.selectedGroup === group ? (
        <BoxWhiskerChart payload={payload} showHeader={false} />
      ) : (
        renderUnsupportedCard(group)
      )}
    </div>
  );
}

export default function StateSimulationMinorityData(props) {
  const { stateName } = useParams();

  const configuredMinorityList = useMemo(() => {
    const stateEntry = props.minorityData.find((entry) => entry.stateName === stateName);
    return stateEntry?.minorityData?.minorityList ?? [];
  }, [props.minorityData, stateName]);

  const [payloads, setPayloads] = useState(null);
  const [currentMinority, changeMinority] = useState(configuredMinorityList[0] ?? "");

  useEffect(() => {
    let isActive = true;
    const stateCode = stateName === "Oregon" ? "OR" : stateName === "South Carolina" ? "SC" : null;
    const group = currentMinority?.trim().toLowerCase().replace(/\s+/g, "_");

    if (!stateCode || !group) {
      setPayloads(null);
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
          setPayloads({
            vraConstrained: vraConstrained.data,
            raceBlind: raceBlind.data,
          });
        }
      } catch {
        if (isActive) {
          setPayloads(null);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [currentMinority, stateName]);

  const minorityList = useMemo(() => {
    const list = new Set(configuredMinorityList);
    if (payloads?.vraConstrained?.selectedGroup) list.add(payloads.vraConstrained.selectedGroup);
    if (payloads?.raceBlind?.selectedGroup) list.add(payloads.raceBlind.selectedGroup);
    return [...list];
  }, [configuredMinorityList, payloads]);

  return (
    <div className="simulationMinority_bodyContainer">
      <div className="simulationMinority_selectorContainer">
        <label htmlFor="simulationMinoritySelector">Choose the Minority to analyze: </label>
        <select
          id="simulationMinoritySelector"
          value={currentMinority}
          onChange={(event) => changeMinority(event.target.value)}
        >
          {minorityList.map((minority) => (
            <option key={minority} value={minority}>{minority}</option>
          ))}
        </select>
      </div>

      <div className="simulationMinority_chartGrid">
        <EnsemblePanel
          eyebrow="GUI-17"
          title={payloads?.vraConstrained?.metricLabel ?? "Simulation Minority Data"}
          subtitle={`VRA-Constrained Ensemble • ${currentMinority}`}
          payload={payloads?.vraConstrained ?? null}
          group={currentMinority}
        />
        <EnsemblePanel
          eyebrow="GUI-17"
          title={payloads?.raceBlind?.metricLabel ?? "Simulation Minority Data"}
          subtitle={`Race-Blind Ensemble • ${currentMinority}`}
          payload={payloads?.raceBlind ?? null}
          group={currentMinority}
        />
      </div>
    </div>
  );
}
