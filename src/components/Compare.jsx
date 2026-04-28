import React, { useEffect, useState } from "react";
import "../../styles/compare.css";
import { useParams } from "react-router-dom";
import { topologyToFeatureCollection } from "../utils/topology.js";
import { toStateCode } from "../utils/stateUtils.js";
import {
  useDistrictTopology,
  useInterestingPlanList,
  useInterestingPlan,
} from "../queries/stateQueries.js";
import DistrictMap from "./DistrictMap.jsx";
import InterestingMap from "./InterestingMap.jsx";
import arrowDropdown from "/white_arrow_drop_down.svg"

export default function Compare() {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);

  // Left map — enacted district plan
  const {
    data: enactedTopo,
    isLoading: leftLoading,
    isError: leftError,
  } = useDistrictTopology(stateCode);

  // Right map — interesting plans
  const {
    data: planList,
    isLoading: listLoading,
    isError: listError,
  } = useInterestingPlanList(stateCode);

  const [showList, setShowList] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("Select a plan");
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    if (planList && planList.length > 0 && !selectedPlanId) {
      setSelectedPlanId(planList[0].planId);
    }
  }, [planList, selectedPlanId]);

  const {
    data: planData,
    isLoading: rightLoading,
    isError: rightError,
  } = useInterestingPlan(stateCode, selectedPlanId);

  const leftMapData = enactedTopo
    ? topologyToFeatureCollection(enactedTopo, "districts")
    : null;

  const rightMapData =
    planData && planData.topology
      ? topologyToFeatureCollection(planData.topology, "districts")
      : null;

  function toggleList() {
    setShowList(!showList);
  }

  function changePlan(planName, planId) {
    setCurrentPlan(planName);
    setSelectedPlanId(planId);
    toggleList();
  }

  return (
    <span id="compare-page-main">
      <div id="compare-page-left-map-container" className="compare-page-map-container">
        <div className="compare-page-left-map-label">
          Current Congressional District Plan of {stateName}
        </div>
        <div className="compare-page-plan-list-container">
          <span className="compare-page-selected" style={{opacity: "0%", cursor: "default"}}>
            {currentPlan}
          </span>
        </div>
        <DistrictMap stateName={stateName} data={leftMapData} />
        {leftLoading && (
          <div className="compare-page-status-message">
            Loading {stateName}&apos;s current district plan...
          </div>
        )}
        {leftError && (
          <div className="compare-page-status-message">
            Unable to load {stateName}&apos;s current district plan
          </div>
        )}
      </div>

      <div id="compare-page-right-map-container" className="compare-page-map-container">
        <div className="compare-page-right-map-label">
          Interesting Generated Plan
        </div>

        {!listLoading && !listError && planList && planList.length > 0 && (
          <div className="compare-page-plan-list-container">
            <span className="compare-page-selected" onClick={() => toggleList()}>
              {currentPlan}
              <img id="dropdown-icon" src={arrowDropdown} width="20px"/>
            </span>
            {showList && (
            <div className="compare-page-dropdown-container">
              {planList.map((plan) => (
                <span key={plan.planId} className={currentPlan === plan.planName ? "compare-page-selected" : "compare-page-plan-option"} onClick={() => changePlan(plan.planName, plan.planId)}>
                  {plan.planName}
                </span>
              ))}
            </div>
            )}
          </div>
        )}

        <InterestingMap stateName={stateName} data={rightMapData} />

        {(listLoading || rightLoading) && (
          <div className="compare-page-status-message">
            Loading {stateName}&apos;s interesting plan...
          </div>
        )}
        {(listError || rightError) && (
          <div className="compare-page-status-message">
            Unable to load {stateName}&apos;s interesting plan
          </div>
        )}
      </div>
    </span>
  );
}
