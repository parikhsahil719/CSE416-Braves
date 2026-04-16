import React, { useEffect, useRef, useState } from "react";
import "../../styles/state-page.css";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import Oregon from "../data/oregon.js";
import SouthCarolina from "../data/sc.js";
import { topologyToFeatureCollection } from "../utils/topology.js";
import DistrictMap from "./DistrictMap"
import MinorityHeatMap from "./MinorityHeatMap";

const DEFAULT_ELECTION = "2024_pres";
const dataMap = { Oregon, SouthCarolina };

function toStateCode(stateName) {
  if (stateName === "Oregon") {
    return "OR";
  }

  if (stateName === "South Carolina") {
    return "SC";
  }

  return null;
}

function isReloadNavigation() {
  if (typeof window === "undefined" || !window.performance) {
    return false;
  }

  const navigationEntries = typeof window.performance.getEntriesByType === "function"
    ? window.performance.getEntriesByType("navigation")
    : [];
  const navigationType = navigationEntries[0]?.type;

  if (navigationType) {
    return navigationType === "reload";
  }

  return window.performance.navigation?.type === 1;
}

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
  };
}

// function getColor(result) {
//   return result === "DEMOCRATIC"
//     ? "#0011ff"
//     : result === "REPUBLICAN"
//       ? "#ff0000"
//       : "#666666";
// }

// function getBaseDistrictStyle(feature) {
//   return {
//     fillColor: getColor(feature?.properties?.RESULT),
//     weight: 2,
//     opacity: 1,
//     color: "white",
//     dashArray: "3",
//     fillOpacity: 0.4,
//   };
// }

// function getSelectedDistrictStyle() {
//   return {
//     weight: 3,
//     color: "#666",
//     dashArray: "",
//     fillOpacity: 0.5,
//   };
// }

function StateData({ stateData, stateName, loading, loadFailed }) {
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

function VoteMarginBadge({ margin }) {
  const isDem = margin >= 0;
  const absMargin = Math.abs(margin).toFixed(1);
  return <span>{isDem ? `D+${absMargin}%` : `R+${absMargin}%`}</span>;
}

function DistrictData({ districts, selectedDistrict, onSelectDistrict, onChangeTab, loading, loadFailed, hasCachedData, hasRequestedData, currMap }) {
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

  useEffect(() => {
    onSelectDistrict(0);
  }, [currMap]);

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
                {currMap === "District Map" ?
                <td className="districts-table-data districts-table-distnum" onClick={() => handleDistrictClick(district.districtNumber)}>
                  {district.districtNumber}
                </td> :
                <td className="districts-table-data districts-table-distnum">
                  {district.districtNumber}
                </td>}
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

// function TopoLayer({ data, infoRef, selectedDistrict, onSelectDistrict, onChangeTab }) {
//   const layerRef = useRef(null);

//   function applySelection(layer) {
//     const districtNumber = layer?.feature?.properties?.district_number;

//     if (districtNumber === selectedDistrict) {
//       layer.setStyle(getSelectedDistrictStyle());
//       layer.bringToFront();
//       return;
//     }

//     layer.setStyle(getBaseDistrictStyle(layer.feature));
//   }

//   function highlightFeature(event) {
//     const layer = event.target;
//     layer.setStyle(getSelectedDistrictStyle());
//     layer.bringToFront();

//     if (infoRef.current) {
//       infoRef.current.update(layer.feature.properties.NAMELSAD);
//     }
//   }

//   function resetHighlight(event) {
//     if (!layerRef.current) {
//       return;
//     }

//     layerRef.current.resetStyle(event.target);
//     applySelection(event.target);

//     if (infoRef.current) {
//       infoRef.current.update();
//     }
//   }

//   function handleMapClick(event) {
//     onSelectDistrict(event.target.feature.properties.district_number);
//     onChangeTab("District");
//   }

//   function onEachFeature(feature, layer) {
//     layer.on({
//       mouseover: highlightFeature,
//       mouseout: resetHighlight,
//       click: handleMapClick,
//     });
//   }

//   useEffect(() => {
//     if (!layerRef.current) {
//       return;
//     }

//     layerRef.current.eachLayer((layer) => {
//       applySelection(layer);
//     });
//   }, [selectedDistrict]);

//   return <GeoJSON ref={layerRef} data={data} style={getBaseDistrictStyle} onEachFeature={onEachFeature} />;
// }

// function Info({ infoRef, stateName }) {
//   const map = useMap();

//   useEffect(() => {
//     const info = L.control({ position: "topright" });

//     info.onAdd = function onAdd() {
//       this._div = L.DomUtil.create("div", "info");
//       this.update();
//       return this._div;
//     };

//     info.update = function update(props) {
//       this._div.innerHTML =
//         `<h4>${stateName}</h4>` +
//         (props ? `<b>${props}</b><br />` : "Click on a district");
//     };

//     info.addTo(map);
//     infoRef.current = info;

//     return () => {
//       info.remove();
//       infoRef.current = null;
//     };
//   }, [map, infoRef, stateName]);

//   return null;
// }

// function Legend() {
//   const map = useMap();

//   useEffect(() => {
//     const legend = L.control({ position: "bottomright" });

//     legend.onAdd = function onAdd() {
//       const div = L.DomUtil.create("div", "info legend");
//       div.innerHTML += `<i style="background:${getColor("DEMOCRATIC")}"></i> Democratic<br>`;
//       div.innerHTML += `<i style="background:${getColor("REPUBLICAN")}"></i> Republican<br>`;
//       return div;
//     };

//     legend.addTo(map);

//     return () => {
//       legend.remove();
//     };
//   }, [map]);

//   return null;
// }

// function Map({ stateName, data, selectedDistrict, onSelectDistrict, onChangeTab }) {
//   const infoRef = useRef(null);

//   if (!data) {
//     return <div id="statePagemap" className="statePageMapPlaceholder" />;
//   }

//   return (
//     <div id="statePagemap">
//       <MapContainer
//         center={stateName === "Oregon" ? [44.1, -120.6] : [33.6, -80.9]}
//         zoomControl={false}
//         zoom={stateName === "Oregon" ? 6.5 : 7.3}
//         zoomSnap={0.1}
//         minZoom={6.5}
//         maxZoom={10}
//         maxBounds={stateName === "Oregon" ? [[47, -125], [41, -116.4]] : [[35.6, -84], [31.5, -77.5]]}
//         className="statePageLeafletMap"
//       >
//         <TileLayer
//           attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
//           url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
//         />
//         <TopoLayer
//           data={data}
//           infoRef={infoRef}
//           selectedDistrict={selectedDistrict}
//           onSelectDistrict={onSelectDistrict}
//           onChangeTab={onChangeTab}
//         />
//         <Info infoRef={infoRef} stateName={stateName} />
//         <Legend />
//       </MapContainer>
//     </div>
//   );
// }

export default function StatePage(props) {
  const { stateName } = useParams();
  const location = useLocation();
  const stateCode = toStateCode(stateName);
  const localData = dataMap[stateName?.replaceAll(" ", "")];
  const [tab, setTab] = useState("State");
  const [tabRequestCount, setTabRequestCount] = useState(0);
  const [requestedTabs, setRequestedTabs] = useState({
    State: false,
    District: false,
    Ensembles: false,
  });
  const [selectedDistrict, setSelectedDistrict] = useState(0);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapData, setMapData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoadFailed, setSummaryLoadFailed] = useState(false);
  const [ensembleSummaryLoading, setEnsembleSummaryLoading] = useState(false);
  const [ensembleSummaryData, setEnsembleSummaryData] = useState(null);
  const [ensembleSummaryLoadFailed, setEnsembleSummaryLoadFailed] = useState(false);
  const [districtTableLoading, setDistrictTableLoading] = useState(false);
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const [districtTable, setDistrictTable] = useState(null);
  const [districtTableLoadFailed, setDistrictTableLoadFailed] = useState(false);
  const prefetchedStateId = location.state?.prefetchedStateId ?? null;
  const prefetchedStateSummary = prefetchedStateId === stateCode ? location.state?.prefetchedStateSummary ?? null : null;
  const shouldForceRefreshSummary = isReloadNavigation();

  if (!localData) {
    return <div style={{ fontWeight: "bolder", margin: "1rem" }}>Error: State not found</div>;
  }

  useEffect(() => {
    let isActive = true;
    const shouldFetchInitialStateSummary = Boolean(stateCode) && (shouldForceRefreshSummary || !prefetchedStateSummary);

    setTab("State");
    setTabRequestCount(shouldFetchInitialStateSummary ? 1 : 0);
    setRequestedTabs({
      State: shouldFetchInitialStateSummary || Boolean(prefetchedStateSummary && !shouldForceRefreshSummary),
      District: false,
      Ensembles: false,
    });
    setSelectedDistrict(0);
    setMapLoading(Boolean(stateCode));
    setMapData(null);
    setMapLoadFailed(false);
    setSummaryLoading(false);
    setSummaryData(shouldForceRefreshSummary ? null : prefetchedStateSummary);
    setSummaryLoadFailed(false);
    setEnsembleSummaryLoading(false);
    setEnsembleSummaryData(null);
    setEnsembleSummaryLoadFailed(false);
    setDistrictTableLoading(false);
    setDistrictTable(null);
    setDistrictTableLoadFailed(false);

    if (!stateCode) {
      setMapLoading(false);
      setMapLoadFailed(true);
      return undefined;
    }

    (async () => {
      try {
        const response = await axios.get(`/api/states/${stateCode}/districts/enacted/topology`);
        if (isActive) {
          setMapData(topologyToFeatureCollection(response.data, "districts"));
          setMapLoadFailed(false);
        }
      } catch {
        if (isActive) {
          setMapData(null);
          setMapLoadFailed(true);
        }
      } finally {
        if (isActive) {
          setMapLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [prefetchedStateSummary, shouldForceRefreshSummary, stateCode, stateName]);

  useEffect(() => {
    let isActive = true;

    if (!stateCode || tabRequestCount === 0) {
      return undefined;
    }

    if (tab === "State") {
      if (summaryData || summaryLoading) {
        return undefined;
      }

      setSummaryLoading(true);
      setSummaryLoadFailed(false);

      (async () => {
        try {
          const response = await axios.get(`/api/states/${stateCode}/state-summary`);
          if (isActive) {
            setSummaryData(response.data);
            setSummaryLoadFailed(false);
          }
        } catch {
          if (isActive) {
            setSummaryData(null);
            setSummaryLoadFailed(true);
          }
        } finally {
          if (isActive) {
            setSummaryLoading(false);
          }
        }
      })();

      return () => {
        isActive = false;
      };
    }

    if (tab === "Ensembles") {
      if (ensembleSummaryData || ensembleSummaryLoading) {
        return undefined;
      }

      setEnsembleSummaryLoading(true);
      setEnsembleSummaryLoadFailed(false);

      (async () => {
        try {
          const response = await axios.get(`/api/states/${stateCode}/ensembles-summary`);
          if (isActive) {
            setEnsembleSummaryData(response.data);
            setEnsembleSummaryLoadFailed(false);
          }
        } catch {
          if (isActive) {
            setEnsembleSummaryData(null);
            setEnsembleSummaryLoadFailed(true);
          }
        } finally {
          if (isActive) {
            setEnsembleSummaryLoading(false);
          }
        }
      })();

      return () => {
        isActive = false;
      };
    }

    if (tab === "District") {
      if (districtTable || districtTableLoading) {
        return undefined;
      }

      setDistrictTableLoading(true);
      setDistrictTableLoadFailed(false);

      (async () => {
        try {
          const response = await axios.get(`/api/states/${stateCode}/districts/enacted/table`, {
            params: { election: DEFAULT_ELECTION },
          });
          if (isActive) {
            setDistrictTable(response.data);
            setDistrictTableLoadFailed(false);
          }
        } catch {
          if (isActive) {
            setDistrictTable(null);
            setDistrictTableLoadFailed(true);
          }
        } finally {
          if (isActive) {
            setDistrictTableLoading(false);
          }
        }
      })();
    }

    return () => {
      isActive = false;
    };
  }, [
    districtTable,
    ensembleSummaryData,
    stateCode,
    summaryData,
    tab,
    tabRequestCount,
  ]);

  const data = mergeSummaryData(localData, summaryData);
  const districtRows = districtTable?.districts ?? [];
  const ensembleSummary = ensembleSummaryData ?? null;

  function handleTabSelect(nextTab) {
    setTab(nextTab);
    setRequestedTabs((tabs) => ({
      ...tabs,
      [nextTab]: true,
    }));
    setTabRequestCount((count) => count + 1);
  }

  function renderActivePanel() {
    if (tab === "State") {
      return (
        <StateData
          stateData={data}
          stateName={stateName}
          loading={summaryLoading}
          loadFailed={summaryLoadFailed}
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
          loading={districtTableLoading}
          loadFailed={districtTableLoadFailed}
          hasCachedData={Boolean(districtTable)}
          hasRequestedData={requestedTabs.District}
          currMap={props.currMap}
        />
      );
    }

    return (
      <EnsembleData
        ensembleSummary={ensembleSummary}
        loading={ensembleSummaryLoading}
        loadFailed={ensembleSummaryLoadFailed}
        hasCachedData={Boolean(ensembleSummaryData)}
        hasRequestedData={requestedTabs.Ensembles}
      />
    );
  }

  return (
    <span id="statePageMain">
      <div id="statePageMapContainer">
        <div className="statePageMapLabel">{props.currMap === 'Precinct Heat Map' ? `${props.currMap} of ${props.currMinority} Population` : props.currMap}</div>
        {props.currMap === "District Map" ?
        <DistrictMap
          stateName={stateName}
          data={mapData}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={setSelectedDistrict}
          onChangeTab={handleTabSelect}
        /> :
        <MinorityHeatMap
          currMinority={props.currMinority}
          switchMinority={props.switchMinority}
        />}
        {mapLoading ? <div className="statePageStatusMessage">Loading {props.currMap}...</div> : null}
        {mapLoadFailed ? (
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
            onClick={() => handleTabSelect("District")}
          >
            District
          </div>
          <div
            className={tab === "Ensembles" ? "statePageDataTab statePageActiveTab" : "statePageDataTab"}
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
