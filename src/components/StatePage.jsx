import React, { useEffect, useState } from "react";
import "../../styles/state-page.css";
import { useParams } from "react-router-dom";
import Oregon from "../data/oregon.js";
import SouthCarolina from "../data/sc.js";
import { topologyToFeatureCollection } from "../utils/topology.js";
import { toStateCode } from "../utils/stateUtils.js";
import { useStateSummary, useEnsemblesSummary, useDistrictTable, useDistrictTopology } from "../queries/stateQueries.js";
import DistrictMap from "./DistrictMap";
import MinorityHeatMap from "./MinorityHeatMap";

const DEFAULT_ELECTION = "2024_pres";
const LOCAL_DATA = { Oregon, SouthCarolina };

function mergeSummaryData(localData, summaryData) {
  if (!summaryData) return localData;
  return {
    ...localData,
    population: summaryData.population ?? localData.population,
    voterDistributionDem: summaryData.voterDistributionDem ?? localData.voterDistributionDem,
    voterDistributionRep: summaryData.voterDistributionRep ?? localData.voterDistributionRep,
    partyControl: summaryData.partyControl ?? localData.partyControl,
    democratReps: summaryData.democratReps ?? localData.democratReps,
    republicanReps: summaryData.republicanReps ?? localData.republicanReps,
  };
}

function VoteMarginBadge({ margin }) {
  const isDem = margin >= 0;
  return <span>{isDem ? `D+${Math.abs(margin).toFixed(1)}%` : `R+${Math.abs(margin).toFixed(1)}%`}</span>;
}

function StateData({ stateData, stateName, loading, loadFailed }) {
  return (
    <>
      <div id="statePageDataContainer">
        {loading   && <div className="statePagePanelStatus">Loading state summary...</div>}
        {loadFailed && <div className="statePagePanelStatus">Unable to load backend state summary. Showing local fallback data.</div>}
        <span className="statePagePopulationDataContainer">
          <span className="statePageDataBubble">
            <p className="statePageDataBubbleLabel">Population:</p>
            <p className="statePageData statePageDataNum">{stateData.population}</p>
          </span>
          <span className="statePageDataBubble">
            <p className="statePageDataBubbleLabel">White Population:</p>
            <p className="statePageData statePageDataNum">{stateData.WhitePopulation}</p>
          </span>
          <span className="statePageDataBubble">
            <p className="statePageDataBubbleLabel">{stateName === "Oregon" ? "Asian" : "Black"} Population:</p>
            <p className="statePageData statePageDataNum">{stateName === "Oregon" ? stateData.AsianPopulation : stateData.BlackPopulation}</p>
          </span>
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

function DistrictData({ districts, selectedDistrict, onSelectDistrict, onChangeTab, loading, loadFailed, currMap }) {
  useEffect(() => { onSelectDistrict(0); }, [currMap]);

  if (loading) return <div id="statePageDataContainer"><div className="congTable_unavailable">Loading congressional representation data...</div></div>;
  if (loadFailed || districts.length === 0) return <div id="statePageDataContainer"><div className="congTable_unavailable">Congressional representation data is not available for this state.</div></div>;

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
              <th className="districts-table-header">Vote Margin<span className="election-tag">2024 Presidential</span></th>
            </tr>
          </thead>
          <tbody>
            {districts.map((d) => (
              <tr key={d.districtNumber} className={d.districtNumber === selectedDistrict ? "districts-table-row districts-table-row--selected" : "districts-table-row"}>
                <td className="districts-table-data districts-table-distnum" onClick={currMap === "District Map" ? () => { onSelectDistrict(d.districtNumber); onChangeTab("District"); } : undefined}>{d.districtNumber}</td>
                <td className="districts-table-data">{d.representative}</td>
                <td className="districts-table-data">{d.party}</td>
                <td className="districts-table-data">{d.racialEthnicGroup}</td>
                <td className="districts-table-data"><VoteMarginBadge margin={d.voteMargin2024} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EnsembleData({ ensembleSummary, loading, loadFailed }) {
  if (loading) return <div id="statePageDataContainer"><div className="congTable_unavailable">Loading ensemble summary...</div></div>;
  if (loadFailed) return <div id="statePageDataContainer"><div className="congTable_unavailable">Ensemble summary is not available for this state.</div></div>;
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

function TabBar({ tab, onSelect }) {
  function cls(name) { return `statePageDataTab${name === "State" ? " statePageLeftDataTab" : ""}${tab === name ? " statePageActiveTab" : ""}`; }
  return (
    <span className="statePageLabelsContainer">
      {["State", "District", "Ensembles"].map(name => (
        <div key={name} className={cls(name)} id={name === "District" ? "statePageDistrictTab" : undefined} onClick={() => onSelect(name)}>{name}</div>
      ))}
    </span>
  );
}

export default function StatePage({ currMap, currMinority, switchMinority }) {
  const { stateName } = useParams();
  const stateCode = toStateCode(stateName);
  const localData = LOCAL_DATA[stateName?.replaceAll(" ", "")];

  const [tab, setTab] = useState("State");
  const [districtTabVisited, setDistrictTabVisited] = useState(false);
  const [ensemblesTabVisited, setEnsemblesTabVisited] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(0);

  const summary  = useStateSummary(stateCode);
  const ensemble = useEnsemblesSummary(stateCode);
  const districts = useDistrictTable(stateCode, districtTabVisited);
  const topo     = useDistrictTopology(stateCode);

  if (!localData) return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Error: State not found</div>;

  const displayData  = mergeSummaryData(localData, summary.data);
  const districtRows = districts.data?.districts ?? [];
  const mapData      = topo.data ? topologyToFeatureCollection(topo.data, "districts") : null;

  function handleTabSelect(nextTab) {
    setTab(nextTab);
    if (nextTab === "District") setDistrictTabVisited(true);
    if (nextTab === "Ensembles") setEnsemblesTabVisited(true);
  }

  function renderPanel() {
    if (tab === "State") return <StateData stateData={displayData} stateName={stateName} loading={summary.isLoading} loadFailed={summary.isError} />;
    if (tab === "District") return <DistrictData districts={districtRows} selectedDistrict={selectedDistrict} onSelectDistrict={setSelectedDistrict} onChangeTab={handleTabSelect} loading={districts.isLoading} loadFailed={districts.isError} currMap={currMap} />;
    return <EnsembleData ensembleSummary={ensemble.data} loading={ensemble.isLoading && ensemblesTabVisited} loadFailed={ensemble.isError} />;
  }

  return (
    <span id="statePageMain">
      <div id="statePageMapContainer">
        <div className="statePageMapLabel">{currMap === 'Precinct Heat Map' ? `${currMap} of ${currMinority} Population in ${stateName}` : `Map of Current Congressional Districts of ${stateName}`}</div>
        {currMap === "District Map"
          ? <DistrictMap stateName={stateName} data={mapData} selectedDistrict={selectedDistrict} onSelectDistrict={setSelectedDistrict} onChangeTab={handleTabSelect} />
          : <MinorityHeatMap currMinority={currMinority} switchMinority={switchMinority} />}
        {topo.isLoading && <div className="statePageStatusMessage">Loading {currMap}...</div>}
        {topo.isError  && <div className="statePageStatusMessage">Unable to load {currMap}</div>}
      </div>
      <div id="statePageDataMainContainer">
        <div className="statePageDataLabel">{tab} Overview</div>
        <TabBar tab={tab} onSelect={handleTabSelect} />
        {renderPanel()}
      </div>
    </span>
  );
}
