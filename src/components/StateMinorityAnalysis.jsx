import React, { useState } from "react";
import '../../styles/minority-analysis.css';
import EiSupportChart from "../charts/EiSupportChart.jsx";
import { getEiSupportPayload } from "../data/chartPayloads.js";
import { useParams } from "react-router-dom";

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

function updateBody(minority, stateName) {
  const eiPayload = getEiSupportPayload(stateName);

  const minorityHMWithLabel = displayData(
    <div className="minorityAnalysis_dataLabel">GUI-4</div>,
    <div className="minorityAnalysis_placeholder">Heat Map Placeholder</div>,
    'minorityAnalysis_dataContainer minorityAnalysis_leftColumn'
  );

  const candidateEIWithLabel = displayData(
    <div className="minorityAnalysis_dataLabel minorityAnalysis_dataLabelSmall">GUI-12</div>,
    <div className="minorityAnalysis_chartStack">
      <div className="minorityAnalysis_chartTitle">Support for {eiPayload.selectedCandidate}</div>
      <div className="minorityAnalysis_chartSubtitle">Estimated support distribution by group</div>
      <EiSupportChart payload={eiPayload} showHeader={false} />
    </div>,
    'minorityAnalysis_dataContainer minorityAnalysis_rightColumn'
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
  for (const d of minorityData) {
    if (d.stateName === stateName) {
      data = d;
      break;
    }
  }
  if (data === null) {
    console.error('StateMinorityAnalysis: Could not find minority data linking to the current state');
  }

  const minorityList = data.minorityData.minorityList;
  const [currentMinority, changeMinority] = useState(minorityList[0] ?? '');
  const minorityOptions = minorityList.map((minority) => <option key={minority} value={minority}>{minority}</option>);

  return (
    <div className="minorityAnalysis_bodyContainer">
      <div className="minorityAnalysis_checkboxContainer">
        <label htmlFor="minoritySelector">Choose the Minority to analyze: </label>
        <select name="minoritySelector" id="minoritySelector" value={currentMinority} onChange={(e) => changeMinority(e.target.value)}>
          {minorityOptions}
        </select>
      </div>
      {currentMinority === '' ? <div /> : updateBody(currentMinority, stateName)}
    </div>
  );
}
