import React, { useMemo, useState } from "react";
import '../../styles/minority-analysis.css'
import BoxWhiskerChart from "../charts/BoxWhiskerChart.jsx";
import EiSupportChart from "../charts/EiSupportChart.jsx";
import { getBoxWhiskerPayload, getEiSupportPayload } from "../data/chartPayloads.js";
import { useNavigate, useParams } from "react-router-dom";

export function displayData(label = <div>this is label</div>, data = <div>this is data</div>, containerClassName = "", widthOfData = null, heightOfData = null)
{
    let style = {};
    if (widthOfData) {
        style['width'] = widthOfData + 'rem';
    }
    if (heightOfData) {
        style['height'] = heightOfData + 'rem';
    }

    return (
        <div className={containerClassName}>
            {label}
            <div style={Object.keys(style).length === 0 ? undefined : style}>
                {data}
            </div>
        </div>
    )
}

function updateBody(minority, stateName)
{
    const boxPayload = getBoxWhiskerPayload(stateName);
    const eiPayload = getEiSupportPayload(stateName);

    const minorityHM = (
        <div className="minorityAnalysis_placeholder">
            Heat Map Placeholder
        </div>
    );
    const minorityHMWithLabel = displayData(
        <div className="minorityAnalysis_dataLabel">GUI-4</div>,
        minorityHM,
        "minorityAnalysis_dataContainer minorityAnalysis_leftColumn"
    );
    const distributionBWWithLabel = displayData(
        <div className="minorityAnalysis_dataLabel minorityAnalysis_dataLabelSmall">GUI-17</div>,
        <div className="minorityAnalysis_chartStack">
          <div className="minorityAnalysis_chartTitle">{boxPayload.metricLabel}</div>
          <BoxWhiskerChart payload={boxPayload} showHeader={false} />
        </div>,
        "minorityAnalysis_dataContainer minorityAnalysis_middleColumn"
    );
    const candidateEIWithLabel1 = displayData(
        <div className="minorityAnalysis_dataLabel minorityAnalysis_dataLabelSmall">GUI-12</div>,
        <div className="minorityAnalysis_chartStack">
          <div className="minorityAnalysis_chartTitle">Support for {eiPayload.selectedCandidate}</div>
          <div className="minorityAnalysis_chartSubtitle">Estimated support distribution by group</div>
          <EiSupportChart payload={eiPayload} showHeader={false} />
        </div>,
        "minorityAnalysis_dataContainer minorityAnalysis_rightColumn"
    );

    return (
        <div className="minorityAnalysis_dataBodyContainer">
            {minorityHMWithLabel}
            {distributionBWWithLabel}
            {candidateEIWithLabel1}
        </div>
    );
}

export default function MinorityAnalysis(props)
{
    const { stateName } = useParams();
    const boxPayload = getBoxWhiskerPayload(stateName);
    const eiPayload = getEiSupportPayload(stateName);
    const minorityList = useMemo(() => {
        const set = new Set([boxPayload.selectedGroup, eiPayload.selectedGroup].filter(Boolean));
        return [...set];
    }, [boxPayload.selectedGroup, eiPayload.selectedGroup]);
    const [currentMinority, changeMinority] = useState(minorityList[0] ?? "");

    const minorityOptions = minorityList.map((minority) => <option key={minority} value={minority}>{minority}</option>)

    let displayBody = updateBody(currentMinority, stateName);
    return (
        <div className="minorityAnalysis_bodyContainer">
            <div className="minorityAnalysis_checkboxContainer">
                <label htmlFor="minoritySelector">Choose the Minority to analyze: </label>
                <select name="minoritySelector" id="minoritySelector" value={currentMinority} onChange={(e) => changeMinority(e.target.value)}>
                    {minorityOptions}
                </select>
            </div>

            {currentMinority === "" ? <div></div> : displayBody}
        </div>)
}
