import React, { useEffect, useState } from "react";
import "../../styles/minority-analysis.css";
import axios from "axios";
import EiSupportChart from "../charts/EiSupportChart.jsx";
import { useParams } from "react-router-dom";
import MinorityHeatMap from "./MinorityHeatMap";

export function displayData(label = <div>this is label</div>, data = <div>this is data</div>, containerClassName = "", widthOfData = null, heightOfData = null) {
  const style = {};
  if (widthOfData) {
    style.width = `${widthOfData}rem`;
  }
  if (heightOfData) {
    style.height = `${heightOfData}rem`;
  }

  return (
    <div className={containerClassName}>
      {label}
      <div style={Object.keys(style).length === 0 ? undefined : style}>
        {data}
      </div>
    </div>
  );
}

function renderEiSection(eiPayload, eiLoading, eiLoadFailed, minority) {
  if (eiLoading) {
    return <div className="minorityAnalysis_placeholder">Loading ecological inference payload...</div>;
  }

  if (eiLoadFailed || !eiPayload) {
    return <div className="minorityAnalysis_placeholder">No backend GUI-12 payload is available for {minority}.</div>;
  }

  return (
    <div className="minorityAnalysis_chartStack">
      <div className="minorityAnalysis_chartTitle">Support for {eiPayload.selectedCandidate}</div>
      <div className="minorityAnalysis_chartSubtitle">Estimated support distribution by group</div>
      <EiSupportChart payload={eiPayload} showHeader={false} />
    </div>
  );
}

function updateBody(minority, eiPayload, eiLoading, eiLoadFailed) {
  const minorityHM = (
    <div>
      <div className="minorityAnalysis_chartTitle">Heat Map of {minority} Population</div>
      <MinorityHeatMap minority={minority} />
    </div>
  );
  const minorityHMWithLabel = displayData(
    <div className="minorityAnalysis_dataLabel minorityAnalysis_dataLabelSmall">GUI-4</div>,
    minorityHM,
    "minorityAnalysis_dataContainer minorityAnalysis_leftColumn"
  );

  const candidateEIWithLabel = displayData(
    <div className="minorityAnalysis_dataLabel minorityAnalysis_dataLabelSmall">GUI-12</div>,
    renderEiSection(eiPayload, eiLoading, eiLoadFailed, minority),
    "minorityAnalysis_dataContainer minorityAnalysis_rightColumn"
  );

  return (
    <div className="minorityAnalysis_dataBodyContainer">
      {minorityHMWithLabel}
      {candidateEIWithLabel}
    </div>
  );
}

export default function MinorityAnalysis(props) {
  const { stateName } = useParams();
  const minorityData = props.minorityData;
  let data = null;
  for (const entry of minorityData) {
    if (entry.stateName === stateName) {
      data = entry;
      break;
    }
  }
  if (data === null) {
    console.error("StateMinorityAnalysis: Could not find minority data linking to the current state");
  }

  const minorityList = data?.minorityData?.minorityList ?? [];
  const [currentMinority, changeMinority] = useState(minorityList[0] ?? "");
  const [eiPayload, setEiPayload] = useState(null);
  const [eiLoading, setEiLoading] = useState(false);
  const [eiLoadFailed, setEiLoadFailed] = useState(false);

  useEffect(() => {
    let isActive = true;
    const stateCode = stateName === "Oregon" ? "OR" : stateName === "South Carolina" ? "SC" : null;
    const groups = currentMinority?.trim().toLowerCase().replace(/\s+/g, "_");

    if (!stateCode || !groups) {
      setEiPayload(null);
      setEiLoading(false);
      setEiLoadFailed(true);
      return undefined;
    }

    setEiLoading(true);
    setEiLoadFailed(false);

    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/analysis/ei-support`, {
          params: {
            groups,
            election: "2024_pres",
            party: "DEM",
          },
        });
        if (isActive) {
          setEiPayload(response.data);
          setEiLoadFailed(false);
        }
      } catch {
        if (isActive) {
          setEiPayload(null);
          setEiLoadFailed(true);
        }
      } finally {
        if (isActive) {
          setEiLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [currentMinority, stateName]);

  const minorityOptions = minorityList.map((minority) => <option key={minority} value={minority}>{minority}</option>);

  return (
    <div className="minorityAnalysis_bodyContainer">
      <div className="minorityAnalysis_checkboxContainer">
        <label htmlFor="minoritySelector">Choose the Minority to analyze: </label>
        <select name="minoritySelector" id="minoritySelector" value={currentMinority} onChange={(event) => changeMinority(event.target.value)}>
          {minorityOptions}
        </select>
      </div>
      {currentMinority === "" ? <div /> : updateBody(currentMinority, eiPayload, eiLoading, eiLoadFailed)}
    </div>
  );
}
