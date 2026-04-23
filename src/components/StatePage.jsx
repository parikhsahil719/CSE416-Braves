import React, { useEffect, useState } from "react";
import "../../styles/state-page.css";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import Oregon from "../data/oregon.js";
import SouthCarolina from "../data/sc.js";
import DistrictMap from "./DistrictMap";
import MinorityHeatMap from "./MinorityHeatMap";
import { toStateCode } from "../lib/stateMetadata.js";
import {
  prefetchStateOverviewData,
  useDistrictTableQuery,
  useDistrictTopologyQuery,
  useEnsembleSummaryQuery,
  useStateSummaryQuery,
} from "../queries/stateQueries.js";

const DEFAULT_ELECTION = "2024_pres";
const dataMap = { Oregon, SouthCarolina };

function mergeSummaryData(localData, summaryData) {
  if (!summaryData) {
    return localData;
  }

  return {
    ...localData,
    population: summaryData.population ?? localData.population,
    voterDistributionDem: summaryData.voterDistributionDem ?? localData.voterDistributionDem,
    voterDistributionRep: summaryData.voterDistributionRep ?? localData.voterDistributionRep,
    partyControl: summaryData.partyControl ?? localData.partyControl,
    democratReps: summaryData.democratReps ?? localData.democratReps,
    republicanReps: summaryData.republicanReps ?? localData.republicanReps,
    feasibleGroups: summaryData.feasibleGroups ?? localData.feasibleGroups,
  };
}

const GROUP_POP_FIELD = {
  Latino: "LatinoPopulation",
  Asian: "AsianPopulation",
  White: "WhitePopulation",
  Black: "BlackPopulation",
};

function StateData({ stateData, loading, loadFailed }) {
  return (
    <>
      <div id="statePageDataContainer">
        {loading ? <div className="statePagePanelStatus">Loading state summary...</div> : null}
        {loadFailed ? <div className="statePagePanelStatus">Unable to load backend state summary. Showing local fallback data.</div> : null}
        <span className="statePagePopulationDataContainer">
          <span className="statePageDataBubble">
            <p className="statePageDataBubbleLabel">Population:</p>
            <p className="statePageData statePageDataNum">{stateData.population}</p>
          </span>
          {(stateData.feasibleGroups ?? []).map((group) => (
            <span key={group} className="statePageDataBubble">
              <p className="statePageDataBubbleLabel">{group} Population:</p>
              <p className="statePageData statePageDataNum">{stateData[GROUP_POP_FIELD[group]] ?? "N/A"}</p>
            </span>
          ))}
        </span>
        <span className="statePageDataBubble">
          <p className="statePageDataBubbleLabel">Party Control of Redistricting:</p>
          <p className="statePageData">{stateData.partyControl}</p>
        </span>
        <span className="statePageDataBubble">
          <p className="statePageDataBubbleLabel">State Voter Distribution (Democratic / Republican):</p>
          <p className="statePageData statePageDataNum">{stateData.voterDistributionDem} / {stateData.voterDistributionRep}</p>
        </span>
        <span className="statePageDataBubble">
          <p className="statePageDataBubbleLabel">Democratic Representatives:</p>
          <p className="statePageData">{stateData.democratReps}</p>
        </span>
        <span className="statePageDataBubble">
          <p className="statePageDataBubbleLabel">Republican Representatives:</p>
          <p className="statePageData">{stateData.republicanReps}</p>
        </span>
      </div>
      <p id="statePageDataFooter">Omitted racial group populations do not meet the feasible group threshold of 200,000.</p>
    </>
  );
}

function VoteMarginBadge({ margin }) {
  const isDem = margin >= 0;
  const absMargin = Math.abs(margin).toFixed(1);
  return <span>{isDem ? `D+${absMargin}%` : `R+${absMargin}%`}</span>;
}

function DistrictData({ districts, selectedDistrict, onSelectDistrict, onChangeTab, loading, loadFailed, hasCachedData, hasRequestedData, currMap }) {
  useEffect(() => {
    onSelectDistrict(0);
  }, [currMap, onSelectDistrict]);

  if (loading || (hasRequestedData && !hasCachedData && !loadFailed)) {
    return (
      <div id="statePageDataContainer">
        <div className="congTable_unavailable">
          Loading congressional representation data...
        </div>
      </div>
    );
  }

  if (loadFailed || districts.length === 0) {
    return (
      <div id="statePageDataContainer">
        <div className="congTable_unavailable">
          Congressional representation data is not available for this state.
        </div>
      </div>
    );
  }

  function handleDistrictClick(districtNumber) {
    onSelectDistrict(districtNumber);
    onChangeTab("District");
  }

  return (
    <div id="statePageDataContainer">
      <div className="districts-table-container">
        <table className="districts-table">
          <thead>
            <tr>
              <th className="districts-table-header">District</th>
              <th className="districts-table-header">Representative</th>
              <th className="districts-table-header">Party</th>
              <th className="districts-table-header">Race / Ethnicity</th>
              <th className="districts-table-header">
                Vote Margin
                <span className="election-tag">2024 Presidential</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {districts.map((district) => (
              <tr
                key={district.districtNumber}
                className={district.districtNumber === selectedDistrict ? "districts-table-row districts-table-row--selected" : "districts-table-row"}
              >
                {currMap === "District Map" ? (
                  <td className="districts-table-data districts-table-distnum" onClick={() => handleDistrictClick(district.districtNumber)}>
                    {district.districtNumber}
                  </td>
                ) : (
                  <td className="districts-table-data districts-table-distnum">
                    {district.districtNumber}
                  </td>
                )}
                <td className="districts-table-data">{district.representative}</td>
                <td className="districts-table-data">{district.party}</td>
                <td className="districts-table-data">{district.racialEthnicGroup}</td>
                <td className="districts-table-data">
                  <VoteMarginBadge margin={district.voteMargin2024} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EnsembleData({ ensembleSummary, loading, loadFailed, hasCachedData, hasRequestedData }) {
  if (loading || (hasRequestedData && !hasCachedData && !loadFailed)) {
    return (
      <div id="statePageDataContainer">
        <div className="congTable_unavailable">
          Loading ensemble summary...
        </div>
      </div>
    );
  }

  if (loadFailed) {
    return (
      <div id="statePageDataContainer">
        <div className="congTable_unavailable">
          Ensemble summary is not available for this state.
        </div>
      </div>
    );
  }

  return (
    <div id="statePageDataContainer">
      <span className="statePageDataBubble">
        <p className="statePageDataBubbleLabel">Number of District Plans in Ensemble:</p>
        <p className="statePageData">{ensembleSummary?.finalPlanCount ?? "Unavailable"}</p>
      </span>
      <span className="statePageDataBubble">
        <p className="statePageDataBubbleLabel">Population Equality Threshold:</p>
        <p className="statePageData">{ensembleSummary?.populationEqualityThreshold ?? "Unavailable"}</p>
      </span>
    </div>
  );
}

export default function StatePage(props) {
  const { stateName } = useParams();
  const queryClient = useQueryClient();
  const stateCode = toStateCode(stateName);
  const localData = dataMap[stateName?.replaceAll(" ", "")];
  const [tab, setTab] = useState("State");
  const [selectedDistrict, setSelectedDistrict] = useState(0);
  const [requestedTabs, setRequestedTabs] = useState({
    State: true,
    District: false,
    Ensembles: false,
  });

  const districtTopologyQuery = useDistrictTopologyQuery(stateCode);
  const stateSummaryQuery = useStateSummaryQuery(stateCode, requestedTabs.State);
  const ensembleSummaryQuery = useEnsembleSummaryQuery(stateCode, requestedTabs.Ensembles);
  const districtTableQuery = useDistrictTableQuery(stateCode, DEFAULT_ELECTION, requestedTabs.District);

  useEffect(() => {
    setTab("State");
    setSelectedDistrict(0);
    setRequestedTabs({
      State: true,
      District: false,
      Ensembles: false,
    });
  }, [stateCode, stateName]);

  if (!localData) {
    return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Error: State not found</div>;
  }

  const mergedSummaryData = mergeSummaryData(localData, stateSummaryQuery.data);
  const districtRows = districtTableQuery.data?.districts ?? [];

  function handleTabSelect(nextTab) {
    setTab(nextTab);
    setRequestedTabs((tabs) => ({
      ...tabs,
      [nextTab]: true,
    }));
  }

  function handleTabHover(nextTab) {
    if (!stateCode) {
      return;
    }

    if (nextTab === "District" || nextTab === "Ensembles") {
      prefetchStateOverviewData(queryClient, stateCode);
    }
  }

  function renderActivePanel() {
    if (tab === "State") {
      return (
        <StateData
          stateData={mergedSummaryData}
          loading={stateSummaryQuery.isPending && !stateSummaryQuery.data}
          loadFailed={stateSummaryQuery.isError && !stateSummaryQuery.data}
        />
      );
    }

    if (tab === "District") {
      return (
        <DistrictData
          districts={districtRows}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
          onChangeTab={handleTabSelect}
          loading={districtTableQuery.isPending && !districtTableQuery.data}
          loadFailed={districtTableQuery.isError && !districtTableQuery.data}
          hasCachedData={Boolean(districtTableQuery.data)}
          hasRequestedData={requestedTabs.District}
          currMap={props.currMap}
        />
      );
    }

    return (
      <EnsembleData
        ensembleSummary={ensembleSummaryQuery.data ?? null}
        loading={ensembleSummaryQuery.isPending && !ensembleSummaryQuery.data}
        loadFailed={ensembleSummaryQuery.isError && !ensembleSummaryQuery.data}
        hasCachedData={Boolean(ensembleSummaryQuery.data)}
        hasRequestedData={requestedTabs.Ensembles}
      />
    );
  }

  return (
    <span id="statePageMain">
      <div id="statePageMapContainer">
        <div className="statePageMapLabel">{props.currMap === 'Precinct Heat Map' ? `${props.currMap} of ${props.currMinority} Population in ${stateName}` : `Map of Current Congressional Districts of ${stateName}`}</div>
        {props.currMap === "District Map" ? (
          <DistrictMap
            stateName={stateName}
            data={districtTopologyQuery.data}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
            onChangeTab={handleTabSelect}
          />
        ) : (
          <MinorityHeatMap
            currMinority={props.currMinority}
            switchMinority={props.switchMinority}
          />
        )}
        {districtTopologyQuery.isPending && !districtTopologyQuery.data ? <div className="statePageStatusMessage">Loading {props.currMap}...</div> : null}
        {districtTopologyQuery.isError && !districtTopologyQuery.data ? (
          <div className="statePageStatusMessage">Unable to load {props.currMap}</div>
        ) : null}
      </div>
      <div id="statePageDataMainContainer">
        <div className="statePageDataLabel">{tab} Overview</div>
        <span className="statePageLabelsContainer">
          <div
            className={tab === "State" ? "statePageDataTab statePageLeftDataTab statePageActiveTab" : "statePageDataTab statePageLeftDataTab"}
            onClick={() => handleTabSelect("State")}
          >
            State
          </div>
          <div
            id="statePageDistrictTab"
            className={tab === "District" ? "statePageDataTab statePageActiveTab" : "statePageDataTab"}
            onMouseEnter={() => handleTabHover("District")}
            onClick={() => handleTabSelect("District")}
          >
            District
          </div>
          <div
            className={tab === "Ensembles" ? "statePageDataTab statePageActiveTab" : "statePageDataTab"}
            onMouseEnter={() => handleTabHover("Ensembles")}
            onClick={() => handleTabSelect("Ensembles")}
          >
            Ensembles
          </div>
        </span>
        {renderActivePanel()}
      </div>
    </span>
  );
}
