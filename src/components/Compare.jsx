import React from "react";
import "../../styles/compare.css";
import { useParams } from "react-router-dom";
import DistrictMap from "./DistrictMap.jsx";
import InterestingMap from "./InterestingMap.jsx";
import { toStateCode } from "../lib/stateMetadata.js";
import { useDistrictTopologyQuery, useInterestingPlanQuery } from "../queries/stateQueries.js";

export default function Compare() {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);

  const districtTopologyQuery = useDistrictTopologyQuery(stateCode);
  const interestingPlanQuery = useInterestingPlanQuery(stateCode);

  return (
    <span id="compare-page-main">
      <div id="compare-page-left-map-container" className="compare-page-map-container">
        <div className="compare-page-left-map-label">Current Congressional District Plan of {stateName}</div>
        <DistrictMap
          stateName={stateName}
          data={districtTopologyQuery.data}
        />
        {districtTopologyQuery.isPending && !districtTopologyQuery.data ? <div className="compare-page-status-message">Loading {stateName}'s current district plan...</div> : null}
        {districtTopologyQuery.isError && !districtTopologyQuery.data ? (
          <div className="compare-page-status-message">Unable to load {stateName}'s current district plan</div>
        ) : null}
      </div>
      <div id="compare-page-right-map-container" className="compare-page-map-container">
        <div className="compare-page-right-map-label">Interesting Plan</div>
        <InterestingMap
          stateName={stateName}
          data={interestingPlanQuery.data?.transformedTopology ?? null}
        />
        {interestingPlanQuery.isPending && !interestingPlanQuery.data ? <div className="compare-page-status-message">Loading {stateName}'s interesting plan...</div> : null}
        {interestingPlanQuery.isError && !interestingPlanQuery.data ? (
          <div className="compare-page-status-message">Unable to load {stateName}'s interesting plan</div>
        ) : null}
      </div>
    </span>
  );
}
