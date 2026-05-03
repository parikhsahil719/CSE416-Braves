import React, { useEffect, useMemo, useState } from "react";
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

function InformationTable({ stateName, data, selectedDistrict, onSelectDistrict }) {

	const { districts } = data;

  return (
    <div className="compare-table-container">
      <table className="compare-table">
        <thead>
          <tr>
            <th className="compare-table-header">District</th>
            {data.feasibleGroups.map((group) => (
              <th key={group} className="compare-table-header">{group} Population</th>
            ))}
            <th className="compare-table-header">Effective District?</th>
          </tr>
        </thead>
        <tbody>
          {districts.map((d) => (
            <tr key={d.districtNumber} className={d.districtNumber === selectedDistrict ? "compare-table-row compare-table-row--selected" : "compare-table-row"}>
              <td className="compare-table-data compare-table-distnum" onClick={() => { onSelectDistrict(d.districtNumber); onChangeTab("District"); }}>{d.districtNumber}</td>
              {d.latinoPopulation && <td className="compare-table-data">{d.latinoPopulation}</td>}
              {d.blackPopulation && <td className="compare-table-data">{d.blackPopulation}</td>}
              <td className="compare-table-data">{d.isEffective}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

  const sortedPlanList = useMemo(
    () =>
      planList
        ? [...planList].sort((a, b) =>
            String(a.planId ?? "").localeCompare(String(b.planId ?? ""), undefined, { numeric: true })
          )
        : [],
    [planList]
  );

  const [showList, setShowList] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("Select a plan");
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(0);

  useEffect(() => {
    if (sortedPlanList.length === 0) {
      setSelectedPlanId(null);
      setCurrentPlan("Select a plan");
      return;
    }

    const matchingPlan = sortedPlanList.find((plan) => plan.planId === selectedPlanId);

    if (matchingPlan) {
      if (currentPlan !== matchingPlan.planName) {
        setCurrentPlan(matchingPlan.planName);
      }
      return;
    }

    setSelectedPlanId(sortedPlanList[0].planId);
    setCurrentPlan(sortedPlanList[0].planName);
  }, [sortedPlanList, selectedPlanId, currentPlan]);

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

  const CONGRESSIONAL_DATA = {    // isEffective is fake; other fields are real
		Oregon: {
			districts: [
				{ districtNumber: 1, latinoPopulation: "71,720", isEffective: "Yes"},
				{ districtNumber: 2, latinoPopulation: "66,135", isEffective: "Yes"},
				{ districtNumber: 3, latinoPopulation: "67,576", isEffective: "Yes"},
				{ districtNumber: 4, latinoPopulation: "42,694", isEffective: "No"},
				{ districtNumber: 5, latinoPopulation: "46,448", isEffective: "No"},
				{ districtNumber: 6, latinoPopulation: "94,821", isEffective: "Yes"},
			],
      feasibleGroups: ["Latino"]
		},
		SouthCarolina: {
			districts: [
				{ districtNumber: 1, blackPopulation: "92,299", isEffective: "No"},
				{ districtNumber: 2, blackPopulation: "133,256", isEffective: "Yes"},
				{ districtNumber: 3, blackPopulation: "95,968", isEffective: "No"},
				{ districtNumber: 4, blackPopulation: "100,848", isEffective: "No"},
				{ districtNumber: 5, blackPopulation: "133,990", isEffective: "Yes"},
				{ districtNumber: 6, blackPopulation: "265,209", isEffective: "Yes"},
				{ districtNumber: 7, blackPopulation: "143,097", isEffective: "Yes"},
			],
      feasibleGroups: ["Black"]
		},
	};

	const stateData = CONGRESSIONAL_DATA[stateName?.replaceAll(' ', '')];

	if (!stateData) {
		return (
			<div className="compareTable_unavailable">
				Congressional representation data is not available for {stateName}.
			</div>
		);
	}

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
      <div id="compare-page-left-container">
        <div id="compare-page-left-map-container" className="compare-page-map-container">
          <div className="compare-page-left-map-label">
            Current Congressional District Plan of {stateName}
          </div>
          <DistrictMap stateName={stateName} data={leftMapData} selectedDistrict={selectedDistrict} onSelectDistrict={setSelectedDistrict} zoom={stateName === "Oregon" ? 6.1 : 6.7} />
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
        <InformationTable stateName={stateName} data={stateData} selectedDistrict={selectedDistrict} onSelectDistrict={setSelectedDistrict} />
      </div>

      <div id="compare-page-right-container">
        <div id="compare-page-right-map-container" className="compare-page-map-container">
          <div className="compare-page-right-map-label">
            Interesting Generated Plan
          </div>

          <div id="compare-page-right-map-subcontainer" className="compare-page-map-subcontainer">
            {!listLoading && !listError && sortedPlanList.length > 0 && (
              <div className="compare-page-plan-list-container">
                <span className="compare-page-selected" onClick={() => toggleList()}>
                  {currentPlan}
                  <img id="dropdown-icon" src={arrowDropdown} width="20px"/>
                </span>
                {showList && (
                <div className="compare-page-dropdown-container">
                  {sortedPlanList.map((plan) => (
                    <span key={plan.planId} className={currentPlan === plan.planName ? "compare-page-selected" : "compare-page-plan-option"} onClick={() => changePlan(plan.planName, plan.planId)}>
                      {plan.planName}
                    </span>
                  ))}
                </div>
                )}
              </div>
            )}

            {selectedPlanId && <InterestingMap stateName={stateName} data={rightMapData} />}

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
        </div>
        <InformationTable stateName={stateName} data={stateData} selectedDistrict={selectedDistrict} onSelectDistrict={setSelectedDistrict} />
      </div>
    </span>
  );
}
