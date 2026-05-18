import React, { useEffect, useMemo, useState } from "react";
import "../../styles/compare.css";
import { useParams } from "react-router-dom";
import { topologyToFeatureCollection } from "../utils/topology.js";
import { groupOptionsForState, toStateCode } from "../utils/stateUtils.js";
import {
  useDistrictTopology,
  useInterestingPlanList,
  useInterestingPlan,
} from "../queries/stateQueries.js";
import DistrictMap from "./DistrictMap.jsx";
import MinorityHeatMap from "./MinorityHeatMap.jsx";
import InterestingMap from "./InterestingMap.jsx";
import arrowDropdown from "/white_arrow_drop_down.svg";

const CONGRESSIONAL_DATA = {
  Oregon: {
    districts: [
      { districtNumber: 1, latinoPopulation: "71,720", isEffective: "No" },
      { districtNumber: 2, latinoPopulation: "66,135", isEffective: "No" },
      { districtNumber: 3, latinoPopulation: "67,576", isEffective: "No" },
      { districtNumber: 4, latinoPopulation: "42,694", isEffective: "No" },
      { districtNumber: 5, latinoPopulation: "46,448", isEffective: "No" },
      { districtNumber: 6, latinoPopulation: "94,821", isEffective: "Yes" },
    ],
  },
  SouthCarolina: {
    districts: [
      { districtNumber: 1, blackPopulation: "92,299", isEffective: "No" },
      { districtNumber: 2, blackPopulation: "133,256", isEffective: "No" },
      { districtNumber: 3, blackPopulation: "95,968", isEffective: "No" },
      { districtNumber: 4, blackPopulation: "100,848", isEffective: "No" },
      { districtNumber: 5, blackPopulation: "133,990", isEffective: "No" },
      { districtNumber: 6, blackPopulation: "265,209", isEffective: "Yes" },
      { districtNumber: 7, blackPopulation: "143,097", isEffective: "Yes" },
    ],
  },
};

function InformationTable({ stateName, data, selectedDistrict, onSelectDistrict }) {
  if (!data) {
    return null;
  }

  const { districts } = data;
  const feasibleGroups = groupOptionsForState(stateName);

  return (
    <div className="compare-table-container">
      <table className="compare-table">
        <thead>
          <tr>
            <th className="compare-table-header compare-table-leftmost-header">District</th>
            {feasibleGroups.map((group) => (
              <th key={group} className="compare-table-header">{group} Population</th>
            ))}
            <th className="compare-table-header compare-table-rightmost-header">Effective District?</th>
          </tr>
        </thead>
        <tbody>
          {districts.map((district) => (
            <tr
              key={district.districtNumber}
              className={district.districtNumber === selectedDistrict ? "compare-table-row compare-table-row--selected" : "compare-table-row"}
            >
              <td
                className="compare-table-data compare-table-distnum compare-table-dataNum"
                onClick={() => onSelectDistrict(district.districtNumber)}
              >
                {district.districtNumber}
              </td>
              {district.latinoPopulation && <td className="compare-table-data compare-table-dataNum">{district.latinoPopulation}</td>}
              {district.blackPopulation && <td className="compare-table-data compare-table-dataNum">{district.blackPopulation}</td>}
              <td className="compare-table-data compare-table-dataText">{district.isEffective}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Compare({ currMap, currMinority, switchMinority }) {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);

  const {
    data: enactedTopo,
    isLoading: leftLoading,
    isError: leftError,
  } = useDistrictTopology(stateCode);

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
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedCurrentDistrict, setSelectedCurrentDistrict] = useState(0);
  const [selectedInterestingDistrict, setSelectedInterestingDistrict] = useState(0);

  useEffect(() => {
    if (sortedPlanList.length === 0) {
      setSelectedPlanId(null);
      return;
    }

    const matchingPlan = sortedPlanList.find((plan) => plan.planId === selectedPlanId);
    if (!matchingPlan) {
      setSelectedPlanId(sortedPlanList[0].planId);
    }
  }, [sortedPlanList, selectedPlanId]);

  const {
    data: planData,
    isLoading: rightLoading,
    isError: rightError,
  } = useInterestingPlan(stateCode, selectedPlanId);

  const leftMapData = useMemo(
    () => (enactedTopo ? topologyToFeatureCollection(enactedTopo) : null),
    [enactedTopo]
  );

  const rightMapData = useMemo(
    () => (planData?.topology ? topologyToFeatureCollection(planData.topology, "data") : null),
    [planData]
  );

  const rightTableData = useMemo(() => {
    if (!rightMapData) {
      return null;
    }

    const minorityKey = stateName === "Oregon" ? "hispanic" : "black";
    const districts = rightMapData.features
      .map((feature) => {
        const properties = feature.properties ?? {};
        const districtNumber = Number(properties.district_id);
        const minorityPopulation = Number(properties[minorityKey] ?? 0);
        const totalPopulation = Number(properties.total ?? 0);
        const isEffective = totalPopulation > 0 && (minorityPopulation / totalPopulation) >= 0.6 ? "Yes" : "No";

        return {
          districtNumber,
          ...(minorityKey === "hispanic"
            ? { latinoPopulation: minorityPopulation.toLocaleString() }
            : { blackPopulation: minorityPopulation.toLocaleString() }),
          isEffective,
        };
      })
      .sort((a, b) => a.districtNumber - b.districtNumber);

    return { districts };
  }, [rightMapData, stateName]);

  const currentPlanName = useMemo(() => {
    const currentPlan = sortedPlanList.find((plan) => plan.planId === selectedPlanId);
    return currentPlan?.planName ?? "Select a plan";
  }, [selectedPlanId, sortedPlanList]);

  const stateData = CONGRESSIONAL_DATA[stateName?.replaceAll(" ", "")];

  function toggleList() {
    setShowList((current) => !current);
  }

  function changePlan(planId) {
    setSelectedPlanId(planId);
    setSelectedInterestingDistrict(0);
    setShowList(false);
  }

  if (!stateData) {
    return (
      <div className="compareTable_unavailable">
        Congressional representation data is not available for {stateName}.
      </div>
    );
  }

  return (
    <span id="compare-page-main">
      <div id="compare-page-left-container">
        <div id="compare-page-left-map-container" className="compare-page-map-container">
          <div className="compare-page-left-map-label">
            Current Congressional District Plan of {stateName}
          </div>
          {currMap === "District Map"
            ? <DistrictMap stateName={stateName} data={leftMapData} selectedDistrict={selectedCurrentDistrict} onSelectDistrict={setSelectedCurrentDistrict} zoom={stateName === "Oregon" ? 6.1 : 6.7} />
            : <MinorityHeatMap currMinority={currMinority} switchMinority={switchMinority} showPrecinctBorders={false} />}
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
        <InformationTable
          stateName={stateName}
          data={stateData}
          selectedDistrict={selectedCurrentDistrict}
          onSelectDistrict={setSelectedCurrentDistrict}
        />
      </div>

      <div id="compare-page-right-container">
        <div id="compare-page-right-map-container" className="compare-page-map-container">
          <div className="compare-page-right-map-label">
            Interesting Generated Plan
          </div>

          <div id="compare-page-right-map-subcontainer" className="compare-page-map-subcontainer">
            {!listLoading && !listError && sortedPlanList.length > 0 && (
              <div className="compare-page-plan-list-container">
                <span className="compare-page-selected" onClick={toggleList}>
                  {currentPlanName}
                  <img id="dropdown-icon" src={arrowDropdown} width="20px"/>
                </span>
                {showList && (
                  <div className="compare-page-dropdown-container">
                    {sortedPlanList.map((plan) => (
                      <span
                        key={plan.planId}
                        className={currentPlanName === plan.planName ? "compare-page-selected" : "compare-page-plan-option"}
                        onClick={() => changePlan(plan.planId)}
                      >
                        {plan.planName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedPlanId && (
              <InterestingMap
                stateName={stateName}
                data={rightMapData}
                selectedDistrict={selectedInterestingDistrict}
                onSelectDistrict={setSelectedInterestingDistrict}
              />
            )}

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
        <InformationTable
          stateName={stateName}
          data={rightTableData}
          selectedDistrict={selectedInterestingDistrict}
          onSelectDistrict={setSelectedInterestingDistrict}
        />
      </div>
    </span>
  );
}
